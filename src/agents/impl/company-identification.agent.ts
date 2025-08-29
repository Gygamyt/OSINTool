import { Injectable, Logger } from '@nestjs/common';
import { AgentContext, AgentResult, IAgent } from '../definitions/agent.interface';
import { env } from '../../config/env';
import { GoogleSearchService } from '../../google-search/google-search.service';
import { AiModelService } from "../../ai";

const createFinalAnalysisPrompt = (companyName: string, searchResults: string): string => {
    return `
Контекст: Ты AI-аналитик OSINT. Твоя задача — на основе ФАКТИЧЕСКИХ данных из поиска Google составить краткий вывод о компании.

<НАЗВАНИЕ КОМПАНИИ ДЛЯ АНАЛИЗА>
${companyName}
</НАЗВАНИЕ КОМПАНИИ ДЛЯ АНАЛИЗА>

<ДАННЫЕ ИЗ ПОИСКА GOOGLE>
${searchResults}
</ДАННЫЕ ИЗ ПОИСКА GOOGLE>

<ЗАДАЧА>
Подтверди существование компании "${companyName}" и кратко опиши ее сферу деятельности, основываясь ИСКЛЮЧИТЕЛЬНО на <ДАННЫЕ ИЗ ПОИСКА GOOGLE>.

<ФОРМАТ ОТВЕТА>
-   Сначала статус: "Заказчик определён: ${companyName}" или "Заказчик не определён".
-   Затем 1-2 предложения с кратким пояснением (например, "Это IT-компания, занимающаяся разработкой мобильных приложений.").
-   Игнорируй компанию-исключение: ${env.COMPANY_TO_IGNORE}.
`;
};


@Injectable()
export class CompanyIdentificationAgent implements IAgent {
    private readonly logger = new Logger(CompanyIdentificationAgent.name);

    constructor(
        private readonly aiModelService: AiModelService,
        private readonly googleSearchService: GoogleSearchService,
    ) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const initialText = context.data.fullText;

        this.logger.log('Step 1: Extracting clean company name...');

        const extractionPrompt = `
Контекст: Ты AI-аналитик, эксперт по стаффинг-запросам. Твоя задача — найти в тексте ОДНО, самое важное название компании.

<ПРАВИЛА И ПРИОРИТЕТЫ>
1.  **ПРИОРИТЕТ №1: Конечный заказчик.** Сначала всегда ищи название конечного заказчика (end client).
2.  **ПРИОРИТЕТ №2: Посредник.** Если имя конечного заказчика ПРЯМО НЕ УКАЗАНО (например, написано просто "клиент из Венгрии"), тогда и ТОЛЬКО ТОГДА ищи и возвращай название компании-посредника (например, Timspark).
3.  **ВАЖНО:** Не путай имена людей с названиями компаний. Например, в тексте может встретиться сокращение "AIvas" — это имя "Алина Ивасюк", а не компания. Всегда анализируй контекст, чтобы отличать имена от организаций.
4.  **ФИНАЛЬНЫЙ ВЫБОР:** Ты ОБЯЗАН сделать выбор. Если есть хотя бы одна компания (заказчик или посредник), ты должен поместить ее название в блок <RESULT>.

<ПОРЯДОК РАБОТЫ>
1.  Внимательно прочти текст в блоке <TEXT>.
2.  Внутри блока <REASONING> опиши свои рассуждения, следуя правилам и приоритетам.
3.  Внутри блока <RESULT> напиши ТОЛЬКО название выбранной компании. Если не удалось найти ни одной, напиши НЕ НАЙДЕНО.

<TEXT>
${initialText}
</TEXT>

<REASONING>
</REASONING>

<RESULT>
</RESULT>
`;
        const extractedNameRaw = await this.aiModelService.generate(extractionPrompt);
        const resultMatch = extractedNameRaw.match(/<RESULT>([\s\S]*?)<\/RESULT>/);
        const extractedName = resultMatch ? resultMatch[1].trim() : 'НЕ НАЙДЕНО';

        if (extractedName.toUpperCase() === 'НЕ НАЙДЕНО' || extractedName.length < 2) {
            this.logger.warn('Company name not found in text. Aborting.');
            return {
                output: 'Заказчик не определён: в исходном тексте не найдено название компании.',
                metadata: { companyName: null, status: 'not_found' }
            };
        }
        this.logger.log(`Step 1 successful. Extracted name for research: "${extractedName}"`);

        this.logger.log(`Step 2: Performing Google search for "${extractedName}"...`);
        const searchResults = await this.googleSearchService.search(
            `${extractedName} company profile`
        );

        this.logger.log('Step 3: Performing final analysis to generate human-readable report...');
        const finalPrompt = createFinalAnalysisPrompt(extractedName, searchResults);
        const finalReport = await this.aiModelService.generate(finalPrompt);

        this.logger.log('Agent finished successfully.');

        return {
            output: finalReport,
            metadata: { companyName: extractedName, status: 'success' }
        };
    }
}