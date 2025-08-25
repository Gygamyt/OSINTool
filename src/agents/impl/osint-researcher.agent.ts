import { Injectable } from "@nestjs/common";
import {
  AgentContext,
  AgentResult,
  IAgent,
} from "../definitions/agent.interface";
import { AiModelService } from "../../ai";

const createOsintResearcherPrompt = (businessDomain = "QA/AQA"): string => {
  return `
Контекст: Ты AI-аналитик.

В контексте передан список компаний для исследования по ключу customer_identifier_output.

Компания-исключение: Innowise Group (полностью игнорировать)

<ЗАДАЧА>

Для каждой компании из списка проведи OSINT-исследование с учетом домена бизнеса: ${businessDomain}. Собери структурированную информацию.

<ПОРЯДОК РАБОТЫ>

1. Перебери все названия компаний, пропуская Innowise Group.
2. Для каждой компании выполни поисковые запросы на русском и английском.
3. Собери данные с фокусом на ${businessDomain}:
   - официальный сайт;
   - сфера деятельности и услуги;
   - тип компании;
   - интересные факты (новости, инвестиции, найм).
4. Указывай "нет данных", если информации нет.

<ФОРМАТ ОТВЕТА>

Обычный текст без JSON и разметки.

<ОСОБЫЕ ТРЕБОВАНИЯ>

- Игнорируй Innowise Group
- Используй только проверяемые факты
- Фокусируйся на релевантности для домена ${businessDomain}
`;
};

@Injectable()
export class OsintResearcherAgent implements IAgent {
  constructor(private readonly aiModelService: AiModelService) {}

  async execute(context: AgentContext): Promise<AgentResult> {
    const { fullText, businessDomain } = context.data;

    const systemPrompt = createOsintResearcherPrompt(businessDomain);

    const finalPrompt = `${systemPrompt}\n\nСписок компаний для анализа:\n${fullText}`;

    const responseFromLLM = await this.aiModelService.generate(finalPrompt);

    return {
      output: responseFromLLM,
    };
  }
}
