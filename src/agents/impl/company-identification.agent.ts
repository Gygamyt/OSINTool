import { Injectable, Logger } from '@nestjs/common';
import { AgentContext, AgentResult, IAgent } from '../definitions/agent.interface';

import { env } from '../../config/env';
import { GoogleSearchService } from '../../google-search/google-search.service';
import { AiModelService } from "../../ai";

// Промпт для финального анализа, который принимает результаты поиска
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
    console.log(initialText + 'asjkfgh');
    // --- ЭТАП 1: ИЗВЛЕЧЕНИЕ НАЗВАНИЯ КОМПАНИИ ---
    this.logger.log('Step 1: Extracting company name from text...');
    const extractionPrompt = `Из следующего текста извлеки ОДНО наиболее вероятное название компании-заказчика. В ответе должно быть ТОЛЬКО НАЗВАНИЕ и ничего больше. Если название не найти, напиши "НЕ НАЙДЕНО". Текст: "${initialText}"`;
    const extractedName = (await this.aiModelService.generate(extractionPrompt)).trim();
    console.log(extractedName);

    if (extractedName.toUpperCase() === 'НЕ НАЙДЕНО' || extractedName.length < 2) {
      this.logger.warn('Company name not found in text. Aborting.');
      return { output: 'Заказчик не определён: в исходном тексте не найдено название компании.' };
    }
    this.logger.log(`Step 1 successful. Extracted name: "${extractedName}"`);

    // --- ЭТАП 2: ПОИСК В GOOGLE ---
    this.logger.log(`Step 2: Performing Google search for "${extractedName}"...`);
    const searchResults = await this.googleSearchService.search(
        `${extractedName} company profile`
    );

    // --- ЭТАП 3: ФИНАЛЬНЫЙ АНАЛИЗ С ДАННЫМИ ИЗ ПОИСКА ---
    this.logger.log('Step 3: Performing final analysis with search results...');
    const finalPrompt = createFinalAnalysisPrompt(extractedName, searchResults);
    const finalReport = await this.aiModelService.generate(finalPrompt);

    this.logger.log('Agent finished successfully.');
    return {
      output: finalReport,
    };
  }
}