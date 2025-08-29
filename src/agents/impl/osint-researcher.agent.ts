import { Injectable } from "@nestjs/common";
import {
  AgentContext,
  AgentResult,
  IAgent,
} from "../definitions/agent.interface";
import { env } from "../../config/env";
import { GoogleSearchService } from "../../google-search/google-search.service";
import { AiModelService } from "../../ai";

const createOsintSummarizerPrompt = (companyName: string, searchResults: string): string => {
  return `
Контекст: Ты AI-аналитик OSINT. Твоя задача — на основе ФАКТИЧЕСКИХ данных из поиска Google составить краткую сводку о компании. Не придумывай ничего, чего нет в предоставленных данных.

<НАЗВАНИЕ КОМПАНИИ ДЛЯ АНАЛИЗА>
${companyName}
</НАЗВАНИЕ КОМПАНИИ ДЛЯ АНАЛИЗА>

<ДАННЫЕ ИЗ ПОИСКА GOOGLE>
${searchResults}
</ДАННЫЕ ИЗ ПОИСКА GOOGLE>

<ЗАДАЧА>
Проанализируй <ДАННЫЕ ИЗ ПОИСКА GOOGLE> и составь OSINT-отчет по компании "${companyName}".
Сконцентрируйся на следующих пунктах:
   - официальный сайт;
   - сфера деятельности и услуги;
   - тип компании (продукт/аутсорс/стартап);
   - интересные факты (новости, инвестиции, найм), если они есть в поиске.

<ФОРМАТ ОТВЕТА>
Обычный текст без JSON и разметки. Структурируй информацию по пунктам. Если данных нет, пиши "нет данных".

<ОСОБЫЕ ТРЕБОВАНИЯ>
- Игнорируй компанию-исключение: ${env.COMPANY_TO_IGNORE}
- Основывайся ТОЛЬКО на предоставленных данных из поиска.
`;
};

@Injectable()
export class OsintResearcherAgent implements IAgent {
  constructor(
      private readonly aiModelService: AiModelService,
      private readonly googleSearchService: GoogleSearchService
  ) {}

  async execute(context: AgentContext): Promise<AgentResult> {
    const initialText = context.data.fullText;
    const businessDomain = context.data.businessDomain || '';

    const companyExtractionPrompt = `Из следующего текста извлеки ОДНО наиболее вероятное название компании-заказчика. В ответе должно быть ТОЛЬКО НАЗВАНИЕ и ничего больше. Текст: "${initialText}"`;
    const companyToResearch = await this.aiModelService.generate(companyExtractionPrompt);

    const searchResults = await this.googleSearchService.search(
        `${companyToResearch.trim()} ${businessDomain} company profile news`
    );

    const finalPrompt = createOsintSummarizerPrompt(companyToResearch.trim(), searchResults);

    const report = await this.aiModelService.generate(finalPrompt);

    return {
      output: report,
    };
  }
}
