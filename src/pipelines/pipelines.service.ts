import { Injectable, Logger } from "@nestjs/common";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import { AgentContext } from "../agents/definitions/agent.interface";
import {
  AttractivenessProfilerAgent,
  CompanyIdentificationAgent,
  InterviewTutorAgent,
  OsintResearcherAgent, ReportFinalizerAgent,
  RequestParsingAgent,
} from "../agents/impl";
import { env } from "../config/env";

@Injectable()
export class PipelinesService {
  private readonly logger = new Logger(PipelinesService.name);

  constructor(
    private readonly companyIdentificationAgent: CompanyIdentificationAgent,
    private readonly requestParsingAgent: RequestParsingAgent,
    private readonly osintResearcherAgent: OsintResearcherAgent,
    private readonly attractivenessProfilerAgent: AttractivenessProfilerAgent,
    private readonly interviewTutorAgent: InterviewTutorAgent, // <--- Внедряем
    private readonly reportFinalizerAgent: ReportFinalizerAgent,
  ) {}

  async startPipeline(createPipelineDto: CreatePipelineDto) {
    const initialText = createPipelineDto.companyName;
    const businessDomain = "IT Staff Augmentation";
    this.logger.log(`Pipeline started for text: "${initialText}"`);

    // --- Шаги 1-3 (без изменений) ---
    const identificationResult = await this.companyIdentificationAgent.execute({
      data: { fullText: initialText },
    });
    const parsingResult = await this.requestParsingAgent.execute({
      data: { fullText: initialText },
    });
    const osintResult = await this.osintResearcherAgent.execute({
      data: { fullText: initialText, businessDomain },
    });

    // --- Шаг 4: Профилирование ---
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

    // --- Шаг 5: Подготовка к интервью ---
    this.logger.log("Executing InterviewTutorAgent...");
    const tutorContext: AgentContext = {
      data: {
        initial_request: initialText,
        parsed_info: parsingResult.output,
        osint_results: osintResult.output,
        attractiveness_and_profile: profilerResult.output,
        businessDomain: businessDomain,
      },
    };
    const tutorResult = await this.interviewTutorAgent.execute(tutorContext);

    this.logger.log('Executing ReportFinalizerAgent...');
    const finalizerContext: AgentContext = {
      data: {
        initial_request: initialText,
        customer_identifier_output: identificationResult.output,
        request_parser_agent_output: parsingResult.output,
        osint_researcher_agent_output: osintResult.output,
        attractiveness_profiler_output: profilerResult.output,
        tutor_output: tutorResult.output, // Можно добавить, если нужно
        businessDomain: businessDomain,
      },
    };
    const finalReport = await this.reportFinalizerAgent.execute(finalizerContext);
    this.logger.log('Final Report Generated.');
    this.logger.log('Pipeline finished successfully.');

    // Финальный ответ API
    return {
      pipelineId: `pipe_${Date.now()}`,
      finalReport: finalReport.output, // <--- Главный результат!
      intermediateSteps: { // Все промежуточные шаги для отладки
        companyIdentification: identificationResult.output,
        requestParsing: parsingResult.output,
        osintResearch: osintResult.output,
        attractivenessProfile: profilerResult.output,
        interviewPrep: tutorResult.output,
      },
    };
  }
}
