import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google } from "googleapis";

@Injectable()
export class GoogleSearchService {
  private readonly logger = new Logger(GoogleSearchService.name);

  constructor(private readonly configService: ConfigService) {}

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
        cx: '',
        q: query,
        auth: '',
        num: 5,
      });

      const items = res.data.items;
      if (!items || items.length === 0) {
        this.logger.warn(`Google search for "${query}" yielded no results.`);
        return "Поиск Google не дал результатов.";
      }

      // Собираем заголовки и сниппеты в единый структурированный текст
      return items
        .map((item) => `Источник: ${item.title}\nСодержание: ${item.snippet}`)
        .filter(Boolean)
        .join("\n\n---\n\n");
    } catch (error) {
      this.logger.error("Google Search API error:", error.stack);
      return `Произошла ошибка при выполнении поиска в Google: ${error.message}`;
    }
  }
}
