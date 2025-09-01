import { Injectable, Logger } from "@nestjs/common";
import { google } from "googleapis";
import {env} from "../config/env";

@Injectable()
export class GoogleSearchService {
  private readonly logger = new Logger(GoogleSearchService.name);

  constructor() {}

  /**
   * Выполняет поиск в Google и возвращает результаты в виде единой строки.
   * @param query Поисковый запрос
   * @returns Строка со сниппетами из поиска или сообщение об ошибке.
   */
  async search(query: string): Promise<string> {
    this.logger.log(`Performing Google search for: "${query}"`);
    try {
      const customsearch = google.customsearch("v1");
      const res = await customsearch.cse.list({
        cx: env.GOOGLE_SEARCH_ENGINE_ID,
        q: query,
        auth: env.GOOGLE_SEARCH_KEY,
        num: env.TOTAL_SEARCH_RESULTS,
      });

      const items = res.data.items;
        this.logger.log(`[SUCCESS] API call successful. Received ${items?.length || 0} items.`);

        if (!items || items.length === 0) {
            this.logger.warn(`[WARN] Google search for "${query}" yielded no results.`);
            return "Поиск Google не дал результатов.";
        }

        const searchContext = items
            .map((item) => {
                const description = item.pagemap?.metatags?.[0]?.['og:description'] || item.snippet;

                const contextLines = [
                    `Источник: ${item.title}`,
                    `Домен: ${item.displayLink}`,
                    `Ссылка: ${item.link}`,
                ];

                if (item.fileFormat) {
                    contextLines.push(`Формат файла: ${item.fileFormat}`);
                }

                contextLines.push(`Описание: ${description}`);

                if (item.pagemap && Object.keys(item.pagemap).length > 0) {
                    contextLines.push(`Дополнительные структурированные данные (JSON):\n${JSON.stringify(item.pagemap, null, 2)}`);
                }

                return contextLines.join('\n');
            })
            .filter(Boolean)
            .join("\n\n---\n\n");

        this.logger.log(`[DONE] Compiled search context of ${searchContext.length} characters.`);
        return searchContext;
    } catch (error) {
        if (error.message && error.message.includes('Quota exceeded')) {
            this.logger.error(`[QUOTA EXCEEDED] Google Search daily limit reached for query: "${query}"`);
            return 'QUOTA_EXCEEDED';
        }
      this.logger.error("Google Search API error:", error.stack);
      return `Произошла ошибка при выполнении поиска в Google: ${error.message}`;
    }
  }
}
