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
    @InjectModel(PipelineRun.name)
    private pipelineRunModel: Model<PipelineRunDocument>,
  ) {
    super();
  }

  async process(job: Job<CreatePipelineDto>): Promise<any> {
    const pipelineRun = await this.pipelineRunModel.create({
      jobId: job.id,
      requestId: job.data.requestId,
      status: "processing",
      request: job.data.request,
      businessDomain: job.data.businessDomain,
    });

    try {
      const initialText = job.data.request;
      const businessDomain = job.data.businessDomain;

      const identificationResult =
        await this.companyIdentificationAgent.execute({
          data: { fullText: initialText },
        });
      const parsingResult = await this.requestParsingAgent.execute({
        data: { fullText: initialText },
      });
      const osintResult = await this.osintResearcherAgent.execute({
        data: { fullText: initialText, businessDomain },
      });
      const profilerResult = await this.attractivenessProfilerAgent.execute({
        data: {
          fullText: initialText,
          initial_request: initialText,
          customer_identifier_output: identificationResult.output,
          request_parser_agent_output: parsingResult.output,
          osint_researcher_agent_output: osintResult.output,
          businessDomain: businessDomain,
        },
      });
      const tutorResult = await this.interviewTutorAgent.execute({
        data: {
          initial_request: initialText,
          parsed_info: parsingResult.output,
          osint_results: osintResult.output,
          attractiveness_and_profile: profilerResult.output,
          businessDomain: businessDomain,
        },
      });
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

      pipelineRun.status = "completed";
      pipelineRun.finalReport = finalReport.output;
      pipelineRun.intermediateSteps = {
        identification: identificationResult.output,
        parsing: parsingResult.output,
        osint: osintResult.output,
        profiling: profilerResult.output,
        tutoring: tutorResult.output,
      };

      await pipelineRun.save();

      return finalReport.output;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      pipelineRun.status = "failed";
      pipelineRun.errorMessage = error.message;
      await pipelineRun.save();

      throw error;
    }
  }
}
