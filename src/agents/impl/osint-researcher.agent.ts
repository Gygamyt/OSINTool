import { Injectable, Logger } from "@nestjs/common";
import {
  AgentContext,
  AgentResult,
  IAgent,
} from "../definitions/agent.interface";
import { AiModelService } from "../../ai";

// Превращаем промпт в функцию, как в вашем python-файле
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
  private readonly logger = new Logger(OsintResearcherAgent.name);

  // <--- 2. Inject AiModelService via the constructor
  constructor(private readonly aiModelService: AiModelService) {}

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.log("Starting OSINT research process with REAL AI...");

    // <--- 3. Replace the old mock logic with the new real logic
    const { fullText, businessDomain } = context.data;

    // Generate the system part of the prompt
    const systemPrompt = createOsintResearcherPrompt(businessDomain);

    // Combine the system prompt with the actual data for analysis
    const finalPrompt = `${systemPrompt}\n\nСписок компаний для анализа:\n${fullText}`;

    // Call the service to generate the response
    const responseFromLLM = await this.aiModelService.generate(finalPrompt);

    this.logger.log("OSINT research process finished.");

    // Return the real result from the AI
    return {
      output: responseFromLLM,
    };
  }
}
