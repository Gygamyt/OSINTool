import { Injectable } from '@nestjs/common';
import { AgentContext, AgentResult, IAgent } from '../definitions/agent.interface';
import { AiModelService } from "../../ai";
import { env } from "../../config/env";

const IDENTIFY_COMPANIES_PROMPT = `
Контекст: Ты аналитик стаффинг‑запросов.   
Компания‑исключение: ${env.COMPANY_TO_IGNORE} (полностью игнорировать)

<ЗАДАЧА>
Определи всех потенциальных заказчиков (компаний) в тексте стаффинг‑запроса, кроме ${env.COMPANY_TO_IGNORE}. Для каждой компании:
1) проверь существование через открытые источники (OSINT);
2) узнай сферу деятельности;
3) сопоставь её со сферами проекта.

<ПОРЯДОК РАБОТЫ>
1. Анализируй весь текст, включая заголовки, списки, e‑mail‑адреса и Salesforce‑ссылки.  
2. Любое слово/фрагмент, отделённое пробелом, дефисом или символом «‑», считай возможным названием компании.  
3. Игнорируй слова, относящиеся к должностям (QA, Developer, Engineer и т.п.).  
4. Для каждого кандидата:  
   — проведи OSINT‑поиск;  
   — определи основные направления бизнеса;  
   — реши, соответствует ли деятельность указанным сферам проекта.  
5. Если деятельность явно вне сферы проекта (Beauty, Fashion, Sports и др.), пометь как «не соответствует профилю проекта».

<ФОРМАТ ОТВЕТА>
• Сначала статус: «Заказчик определён: <название>» или «Заказчик не определён».  
• Затем список релевантных компаний с кратким пояснением соответствия.  
• Нерелевантные компании перечисли одной строкой: «Не соответствуют профилю проекта: …».  
• Краткий связный текст, без JSON, фигурных скобок и Markdown.  
• Используй короткие абзацы и списки для читаемости.

<ОСОБЫЕ ТРЕБОВАНИЯ>
— Всегда игнорируй любые упоминания ${env.COMPANY_TO_IGNORE}.  
— Основывайся только на фактах из открытых источников и информации о проекте.  
— Не добавляй лишних форматов или разметки.
`;

@Injectable()
export class CompanyIdentificationAgent implements IAgent {
    constructor(private readonly aiModelService: AiModelService) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const finalPrompt = `${IDENTIFY_COMPANIES_PROMPT}\n\nТекст для анализа:\n${context.data.fullText}`;

        const responseFromLLM = await this.aiModelService.generate(finalPrompt);

        return {
            output: responseFromLLM,
        };
    }
}
