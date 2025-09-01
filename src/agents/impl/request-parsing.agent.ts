import { Injectable, Logger } from '@nestjs/common';
import { AgentContext, AgentResult, IAgent } from '../definitions/agent.interface';
import { AiModelService } from "../../ai";

const REQUEST_PARSING_PROMPT = `
Контекст: Ты AI-аналитик, который преобразует текст стаффинг-запроса в структурированный JSON.

<JSON СХЕМА>
{
  "intermediary": "название компании-посредника",
  "role": "название требуемой роли",
  "stack": ["технология 1", "технология 2"],
  "duration": "длительность проекта"
}

<ПРАВИЛА>
1.  Проанализируй текст и извлеки информацию согласно схеме.
2.  Если какую-то информацию найти не удалось, используй null в качестве значения.
3.  ‼️ ВАЖНОЕ ПРАВИЛО: Твой ответ должен быть СТРОГО JSON-объектом. Не добавляй \`\`\`json\` или любую другую разметку или текст.
`;

const formatStructuredDataToReadable = (data: any): string => {
    return [
        `• Компания-посредник: ${data.intermediary || 'не указана'}`,
        `• Роль: ${data.role || 'не указана'}`,
        `• Стек технологий: ${data.stack?.join(', ') || 'не указан'}`,
        `• Длительность проекта: ${data.duration || 'не указана'}`
    ].join('\n');
};

@Injectable()
export class RequestParsingAgent implements IAgent {
    private readonly logger = new Logger(RequestParsingAgent.name);
    constructor(private readonly aiModelService: AiModelService) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const finalPrompt = `${REQUEST_PARSING_PROMPT}\n\nТекст для анализа:\n${context.data.fullText}`;
        const responseFromLLM = await this.aiModelService.generate(finalPrompt);

        try {
            let jsonString = responseFromLLM;

            const match = responseFromLLM.match(/```json\n([\s\S]*?)\n```/);
            if (match && match[1]) {
                this.logger.log('Found JSON inside a Markdown block. Extracting content.');
                jsonString = match[1];
            }

            const structuredData = JSON.parse(jsonString);
            const readableData = formatStructuredDataToReadable(structuredData);

            this.logger.log('Successfully parsed AI response and created dual output.');

            return {
                output: readableData,
                metadata: structuredData,
            };
        } catch (error) {
            this.logger.error('Failed to parse JSON from AI response.', { rawResponse: responseFromLLM });
            const errorData = { intermediary: null, role: null, stack: [], duration: null };
            return {
                output: 'Не удалось разобрать запрос.',
                metadata: errorData
            };
        }
    }
}
