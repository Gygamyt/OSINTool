import { Injectable, Logger } from "@nestjs/common";
import {
  AgentContext,
  AgentResult,
  IAgent,
} from "../definitions/agent.interface";
import { AiModelService } from "../../ai"; // <--- 1. Import AiModelService

// The prompt-creating function remains unchanged
const createReportFinalizerPrompt = (businessDomain = "QA/AQA") => {
  return `
Контекст: Ты AI-аналитик.

Доступные данные:
- исходный запрос (initial_request)
- результат парсинга (request_parser_agent_output)
- результат оценки привлекательности (attractiveness_profiler_output)
- OSINT-сводка по компаниям (osint_researcher_agent_output)
- идентифицированный заказчик (customer_identifier_output)

Возможности Innowise:
- зрелая экспертиза в области ${businessDomain}
- AI-подходы в тестировании
- автоматизация в CI/CD
- полный спектр тестирования
- опыт работы со стартапами и крупными корпоративными проектами

<ЗАДАЧА>

Подготовь единый "Финальный отчёт" в строгой структуре, используя доступные данные.

<СТРУКТУРА ФИНАЛЬНОГО ОТЧЁТА>

1. Идентифицированный заказчик и роль других компаний
2. Полный анализ запроса
3. Детальное OSINT-исследование каждой компании
4. Оценка привлекательности вакансии
   4.1 Тип проекта и нужный профиль
   4.2 Привлекательность вакансии (плюсы/минусы)
   4.3 Портрет идеального кандидата
   4.4 Что может быть плюсом для проекта
5. План подготовки к собеседованию

<ОСОБЫЕ ТРЕБОВАНИЯ>

- Используй только данные из входных ключей
- Не добавляй свои выводы или интерпретации
- Не упоминай компанию Innowise Group
- Формат — обычный текст с чёткой вложенной структурой
`;
};

@Injectable()
export class ReportFinalizerAgent implements IAgent {
  private readonly logger = new Logger(ReportFinalizerAgent.name);

  // <--- 2. Inject AiModelService
  constructor(private readonly aiModelService: AiModelService) {}

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.log("Starting report finalization process with REAL AI...");

    // <--- 3. Replace mock logic with the real AI call
    // Extract all necessary data from the context provided by the PipelinesService
    const {
      businessDomain,
      initial_request,
      customer_identifier_output,
      request_parser_agent_output,
      osint_researcher_agent_output,
      attractiveness_profiler_output,
    } = context.data;

    // Create the system part of the prompt
    const systemPrompt = createReportFinalizerPrompt(businessDomain);

    // Assemble the final, comprehensive prompt for the AI
    const finalPrompt = `
${systemPrompt}

<ВХОДНЫЕ ДАННЫЕ>

### Исходный запрос (initial_request):
${initial_request}

### Идентифицированный заказчик (customer_identifier_output):
${customer_identifier_output}

### Результат парсинга (request_parser_agent_output):
${request_parser_agent_output}

### OSINT-сводка по компаниям (osint_researcher_agent_output):
${osint_researcher_agent_output}

### Результат оценки привлекательности (attractiveness_profiler_output):
${attractiveness_profiler_output}

</ВХОДНЫЕ ДАННЫЕ>
`;

    // Call the AI service
    const responseFromLLM = await this.aiModelService.generate(finalPrompt);

    this.logger.log("Report finalization process finished.");

    // Return the real, final report from the AI
    return {
      output: responseFromLLM,
    };
  }
}
