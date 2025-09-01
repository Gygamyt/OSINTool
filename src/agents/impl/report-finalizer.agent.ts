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
Контекст: Ты — главный AI-аналитик. Твоя задача — изучить отчеты от команды младших агентов-аналитиков и на их основе написать единый, связный и структурированный финальный отчет для клиента.

<ЗАДАЧА>
Твоя задача — не просто скопировать блоки текста из <ВХОДНЫХ ДАННЫХ>, а **проанализировать, синтезировать и переработать** информацию из них в рамках домена ${businessDomain}. Представь ее в виде целостного, хорошо написанного документа, следуя <СТРУКТУРЕ ФИНАЛЬНОГО ОТЧЁТА>.

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
- **САМОДОСТАТОЧНОСТЬ:** Твой финальный отчет должен быть полным и понятным без обращения к исходным данным.
- **ЗАПРЕЩЕНО:** Не ссылайся на названия ключей (например, "согласно osint_researcher_agent_output..."). Вместо этого, интегрируй саму ИНФОРМАЦИЮ в свой текст.
- **ТОН:** Профессиональный, аналитический, структурированный.
- Не упоминай компанию ${env.COMPANY_TO_IGNORE}.
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
        tutor_output,
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

### План подготовки к собеседованию (tutor_output):
${tutor_output}

</ВХОДНЫЕ ДАННЫЕ>
`;

    const responseFromLLM = await this.aiModelService.generate(finalPrompt);

    return {
      output: responseFromLLM,
    };
  }
}
