import { Injectable } from '@nestjs/common';
import { AgentContext, AgentResult, IAgent } from '../definitions/agent.interface';
import { AiModelService } from "../../ai";

const REQUEST_PARSING_PROMPT = `
Контекст: Ты аналитик стаффинг‑запросов.  
В контексте под ключом initial_request передан полный текст запроса.
Process data from state key 'customer_identifier_output'

<ЗАДАЧА>
Проанализируй стаффинг‑запрос и извлеки четыре блока информации:  
1) название компании‑посредника, указанной в заголовке;  
2) название требуемой роли (например, QA, SQA);  
3) запрашиваемый стек технологий;  
4) предполагаемая длительность проекта (например, «1‑3 месяца»).

<ПОРЯДОК РАБОТЫ>
1. Обрабатывай весь текст запроса, включая заголовок, списки, примечания и подписи.  
2. Для каждого пункта используй явные формулировки из текста; если формулировка неявная, делай вывод на основе контекста, но отмечай это пояснением «(выведено из описания)».  
3. Игнорируй лишние детали, не относящиеся к четырём указанным блокам.

<ФОРМАТ ОТВЕТА>
• Компания-посредник: <название>  
• Роль: <название роли>  
• Стек технологий: <список ключевых технологий через запятую>  
• Длительность проекта: <указанная длительность>  

Кратко, без JSON, фигурных скобок и Markdown. Используй короткие абзацы и списки для читаемости.
`;

@Injectable()
export class RequestParsingAgent implements IAgent {
    constructor(private readonly aiModelService: AiModelService) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const finalPrompt = `${REQUEST_PARSING_PROMPT}\n\nТекст для анализа:\n${context.data.fullText}`;

        const responseFromLLM = await this.aiModelService.generate(finalPrompt);

        return {
            output: responseFromLLM,
        };
    }
}