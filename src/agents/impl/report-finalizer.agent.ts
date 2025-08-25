import { Injectable } from "@nestjs/common";
import {
  AgentContext,
  AgentResult,
  IAgent,
} from "../definitions/agent.interface";
import { AiModelService } from "../../ai";
import { env } from "../../config/env";

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
- Не упоминай компанию ${env.COMPANY_TO_IGNORE}
- Формат — обычный текст с чёткой вложенной структурой
`;
};

@Injectable()
export class ReportFinalizerAgent implements IAgent {
  constructor(private readonly aiModelService: AiModelService) {}

  async execute(context: AgentContext): Promise<AgentResult> {
    const {
      businessDomain,
      initial_request,
      customer_identifier_output,
      request_parser_agent_output,
      osint_researcher_agent_output,
      attractiveness_profiler_output,
    } = context.data;

    const systemPrompt = createReportFinalizerPrompt(businessDomain);

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

    const responseFromLLM = await this.aiModelService.generate(finalPrompt);

    return {
      output: responseFromLLM,
    };
  }
}
