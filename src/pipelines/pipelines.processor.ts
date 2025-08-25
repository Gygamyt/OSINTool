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
  ) {
    super();
  }
  async process(job: Job<CreatePipelineDto>): Promise<any> {
    this.logger.log(`Processing job ${job.id} with name ${job.name}...`);

    switch (job.name) {
      case "run-pipeline":
        return this.handleRunPipeline(job);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleRunPipeline(job: Job<CreatePipelineDto>) {
    const createPipelineDto = job.data;
    this.logger.log(
      `Executing pipeline for company: "${createPipelineDto.companyName}"...`,
    );

    try {
      const initialText = createPipelineDto.companyName;
      const { businessDomain } = createPipelineDto;

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

      this.logger.log(`Job ${job.id} completed successfully.`);
      return finalReport.output;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
