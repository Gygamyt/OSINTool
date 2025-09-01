import { Injectable, Logger } from "@nestjs/common";
import {
    AgentContext,
    AgentResult,
    IAgent,
} from "../definitions/agent.interface";
import { AiModelService } from "../../ai";
import { GoogleSearchService } from "../../google-search/google-search.service";

// ‼️ ОБНОВЛЕННЫЙ ПРОМПТ ‼️
const createInterviewTutorPrompt = (
    vacancyInfo: string,
    googleSearchResults: string
): string => {
    return `
Контекст: Ты AI-агент, который помогает готовить кандидатов к техническому собеседованию.

<ИНФОРМАЦИЯ О ВАКАНСИИ>
${vacancyInfo}
</ИНФОРМАЦИЯ О ВАКАНСИИ>

<АКТУАЛЬНЫЕ ПРИМЕРЫ ВОПРОСОВ ИЗ GOOGLE>
${googleSearchResults}
</АКТУАЛЬНЫЕ ПРИМЕРЫ ВОПРОСОВ ИЗ GOOGLE>

<ЗАДАЧА>
Подготовь для кандидата структурированный пакет материалов, основываясь на ВСЕЙ предоставленной информации.
1) 5-7 ключевых технических вопросов, адаптированных под стек из вакансии и актуальные тренды из поиска Google.
2) 3-5 поведенческих вопросов.
3) 3-4 умных вопроса кандидата к интервьюеру.
4) 2-3 практических совета по подготовке.

<ФОРМАТ ОТВЕТА>
• Технические вопросы:
1. …
• Поведенческие вопросы:
1. …
• Вопросы кандидата интервьюеру:
1. …
• Советы по подготовке:
— …

Кратко, без JSON, фигурных скобок и Markdown.
`;
};

@Injectable()
export class InterviewTutorAgent implements IAgent {
    private readonly logger = new Logger(InterviewTutorAgent.name);

    constructor(
        private readonly aiModelService: AiModelService,
        private readonly googleSearchService: GoogleSearchService
    ) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const parsingResult = context.data.parsed_info as AgentResult;
        const vacancyInfo = `
          - Исходный запрос: ${context.data.initial_request}
          - Результаты парсинга (читаемые): ${parsingResult.output}
          - OSINT по компании: ${context.data.osint_results.output}
          - Анализ привлекательности: ${context.data.attractiveness_and_profile.output}
        `;

        const structuredData = parsingResult.metadata;

        const techStackForSearch = `${structuredData!.role} ${structuredData!.stack?.join(' ')}`.trim() || context.data.businessDomain;
        this.logger.log(`Searching Google for interview questions related to: "${techStackForSearch}"`);

        const searchResults = await this.googleSearchService.search(
            `актуальные вопросы для собеседования ${techStackForSearch} 2025`
        );

        const finalPrompt = createInterviewTutorPrompt(vacancyInfo, searchResults);
        const responseFromLLM = await this.aiModelService.generate(finalPrompt);

        return {
            output: responseFromLLM,
        };
    }
}
