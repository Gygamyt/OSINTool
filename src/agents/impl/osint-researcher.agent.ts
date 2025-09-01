import { Injectable, Logger } from "@nestjs/common";
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
    private readonly logger = new Logger(OsintResearcherAgent.name);

    constructor(
        private readonly aiModelService: AiModelService,
        private readonly googleSearchService: GoogleSearchService
    ) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const companyInfo = context.data.company_info as AgentResult;
        const companyToResearch = companyInfo.metadata?.companyName;
        const status = companyInfo.metadata?.status;
        const businessDomain = context.data.businessDomain || '';

        if (status !== 'success' || !companyToResearch) {
            this.logger.warn(`Skipping OSINT search because company was not identified.`);
            return { output: 'OSINT-исследование пропущено, так как компания не была идентифицирована.' };
        }

        this.logger.log(`Starting multi-vector OSINT research for company: "${companyToResearch}"`);

        const searchTopics = [
            'official website and company profile',
            'recent news and press releases',
            // 'employee reviews Glassdoor',
            // 'client reviews and case studies',
            'funding rounds and investments',
            'products and services overview',
            // 'competitors and alternatives'
        ];

        const searchQueries = searchTopics.map(topic => `"${companyToResearch}" ${businessDomain} ${topic}`);

        this.logger.log(`Executing ${searchQueries.length} parallel searches...`);
        const searchPromises = searchQueries.map(query => this.googleSearchService.search(query));
        const allSearchResults = await Promise.all(searchPromises);

        if (allSearchResults.some(res => res === 'QUOTA_EXCEEDED')) {
            this.logger.warn(`Proceeding without full OSINT data due to quota limits.`);
            const fallbackReport = `OSINT-исследование не удалось завершить из-за превышения дневной квоты Google Search. Анализ основан на внутреннем знании модели.`;
            return { output: fallbackReport };
        }

        const combinedContext = allSearchResults.join('\n\n---\n\n');
        this.logger.log(`Combined all search results into a single context of ${combinedContext.length} characters.`);

        const finalPrompt = createOsintSummarizerPrompt(companyToResearch, combinedContext);
        const report = await this.aiModelService.generate(finalPrompt);

        return {
            output: report,
        };
    }
}
