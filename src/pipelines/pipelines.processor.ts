import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import {
    AttractivenessProfilerAgent,
    CompanyIdentificationAgent,
    InterviewTutorAgent,
    OsintResearcherAgent,
    ReportFinalizerAgent,
    RequestParsingAgent,
} from "../agents/impl";
import { InjectModel } from "@nestjs/mongoose";
import {
    PipelineRun,
    PipelineRunDocument,
} from "./schemas/pipeline-run.schema";
import { Model } from "mongoose";
import { IAgent, AgentContext, AgentResult } from "../agents/definitions/agent.interface";
import { ValidationAgent } from "../agents/impl/validation.agent";

@Processor("pipelines")
export class PipelinesProcessor extends WorkerHost {
    private readonly logger = new Logger(PipelinesProcessor.name);

    constructor(
        private readonly companyIdentificationAgent: CompanyIdentificationAgent,
        private readonly requestParsingAgent: RequestParsingAgent,
        private readonly osintResearcherAgent: OsintResearcherAgent,
        private readonly attractivenessProfilerAgent: AttractivenessProfilerAgent,
        private readonly interviewTutorAgent: InterviewTutorAgent,
        private readonly reportFinalizerAgent: ReportFinalizerAgent,
        private readonly validationAgent: ValidationAgent,
        @InjectModel(PipelineRun.name)
        private pipelineRunModel: Model<PipelineRunDocument>,
    ) {
        super();
    }

    /**
     * A wrapper method that executes an agent and validates its output, with retries.
     */
    private async executeAndValidateAgent(
        jobId: string,
        agent: IAgent,
        context: AgentContext,
        validationCriteria: string,
        agentName: string
    ): Promise<AgentResult> {
        let agentResult: AgentResult = {
            output: `Agent ${agentName} failed to produce a valid result after multiple retries.`,
            metadata: { error: true }
        };

        let isValid = false;
        const maxRetries = 2;

        for (let attempt = 1; attempt <= maxRetries && !isValid; attempt++) {
            this.logger.log(`[${jobId}] Executing ${agentName}, attempt #${attempt}...`);
            agentResult = await agent.execute(context);

            const validationResult = await this.validationAgent.execute({
                data: { textToValidate: agentResult.output, criteria: validationCriteria }
            });

            isValid = validationResult.metadata!.is_valid;

            if (!isValid) {
                this.logger.warn(`[${jobId}] ${agentName} validation failed. Critique: ${validationResult.metadata!.critique}. Retrying...`);
            } else {
                this.logger.log(`[${jobId}] ${agentName} validation successful.`);
            }
        }

        if (!isValid) {
            this.logger.error(`[${jobId}] ${agentName} failed validation after ${maxRetries} attempts. Proceeding with the last result.`);
        }

        return agentResult;
    }

    async process(job: Job<CreatePipelineDto>): Promise<any> {
        const { id: jobId, data: jobData } = job;
        this.logger.log(`[${jobId}] New job received. Starting pipeline for requestId: ${jobData.requestId}`);

        const pipelineRun = await this.pipelineRunModel.create({
            jobId: jobId,
            requestId: jobData.requestId,
            status: "processing",
            request: jobData.request,
            businessDomain: jobData.businessDomain,
        });

        try {
            const initialText = jobData.request;
            const businessDomain = jobData.businessDomain;

            // --- Step 1: Company Identification ---
            const identificationResult = await this.executeAndValidateAgent(
                jobId!,
                this.companyIdentificationAgent,
                { data: { fullText: initialText } },
                'The output must contain a clearly identified company name or a "Customer not identified" status.',
                'CompanyIdentificationAgent'
            );

            // --- Step 2: OSINT Research ---
            const osintResult = await this.executeAndValidateAgent(
                jobId!,
                this.osintResearcherAgent,
                { data: { company_info: identificationResult, businessDomain } },
                'The report must be detailed, contain several sections (profile, news, reputation), and not be overly short or generic.',
                'OsintResearcherAgent'
            );

            // --- Step 3: Request Parsing ---
            const parsingResult = await this.executeAndValidateAgent(
                jobId!,
                this.requestParsingAgent,
                { data: { fullText: initialText, osint_researcher_agent_output: osintResult.output } },
                'The output must be a structured list with four points: Intermediary Company, Role, Stack, and Duration.',
                'RequestParsingAgent'
            );

            // --- Step 4: Attractiveness Profiling ---
            const profilerResult = await this.executeAndValidateAgent(
                jobId!,
                this.attractivenessProfilerAgent,
                { data: {
                        initial_request: initialText,
                        customer_identifier_output: identificationResult.output,
                        request_parser_agent_output: parsingResult.output,
                        osint_researcher_agent_output: osintResult.output,
                        businessDomain: businessDomain,
                    }},
                'The report must contain an analysis of the vacancy, the ideal candidate, and typical tasks.',
                'AttractivenessProfilerAgent'
            );

            // --- Step 5: Interview Tutoring ---
            const tutorResult = await this.executeAndValidateAgent(
                jobId!,
                this.interviewTutorAgent,
                { data: {
                        initial_request: initialText,
                        parsed_info: parsingResult,
                        osint_results: osintResult,
                        attractiveness_and_profile: profilerResult,
                        businessDomain: businessDomain,
                    }},
                'The output must include specific technical questions, behavioral questions, and tips for preparation.',
                'InterviewTutorAgent'
            );

            // --- Step 6: Final Report Generation (No validation needed as it's just an assembly) ---
            this.logger.log(`[${jobId}] [6/6] Executing ReportFinalizerAgent...`);
            const finalReport = await this.reportFinalizerAgent.execute({
                data: {
                    initial_request: initialText,
                    customer_identifier_output: identificationResult.output,
                    request_parser_agent_output: parsingResult.output,
                    osint_researcher_agent_output: osintResult.output,
                    attractiveness_profiler_output: profilerResult.output,
                    tutor_output: tutorResult.output,
                    businessDomain: businessDomain,
                },
            });
            this.logger.log(`[${jobId}] [6/6] ReportFinalizerAgent finished.`);

            // --- Saving Results ---
            this.logger.log(`[${jobId}] All agents executed. Saving final results to database...`);
            pipelineRun.status = "completed";
            pipelineRun.finalReport = finalReport.output;
            pipelineRun.intermediateSteps = {
                identification: identificationResult.output,
                osint: osintResult.output,
                parsing: parsingResult.output,
                profiling: profilerResult.output,
                tutoring: tutorResult.output,
            };

            await pipelineRun.save();
            this.logger.log(`[${jobId}] Results saved successfully.`);
            this.logger.log(`[${jobId}] Pipeline finished successfully.`);

            return finalReport.output;
        } catch (error) {
            this.logger.error(`[${jobId}] Pipeline failed: ${error.message}`, error.stack);
            pipelineRun.status = "failed";
            pipelineRun.errorMessage = error.message;
            await pipelineRun.save();

            throw error;
        }
    }
}
