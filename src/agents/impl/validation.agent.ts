import { Injectable, Logger } from '@nestjs/common';
import {AiModelService} from "../../ai";
import {AgentContext, AgentResult, IAgent} from "../definitions/agent.interface";

const createValidationPrompt = (textToValidate: string, criteria: string): string => {
    return `
Контекст: Ты AI-контролер качества. Твоя задача — оценить текст, сгенерированный другим AI, на соответствие заданным критериям.

<ТЕКСТ ДЛЯ ОЦЕНКИ>
${textToValidate}
</ТЕКСТ ДЛЯ ОЦЕНКИ>

<КРИТЕРИИ КАЧЕСТВА>
${criteria}
</КРИТЕРИИ КАЧЕСТВА>

<ЗАДАЧА>
Проанализируй текст и верни свой вердикт СТРОГО в формате JSON.
- "is_valid": true, если текст полностью соответствует критериям, иначе false.
- "critique": "Краткая критика и что нужно исправить.", если is_valid: false.

<ФОРМАТ ОТВЕТА (ТОЛЬКО JSON)>
{"is_valid": boolean, "critique": "string"}
`;
};

@Injectable()
export class ValidationAgent implements IAgent {
    private readonly logger = new Logger(ValidationAgent.name);
    constructor(private readonly aiModelService: AiModelService) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        const { textToValidate, criteria } = context.data;
        const finalPrompt = createValidationPrompt(textToValidate, criteria);
        const responseFromLLM = await this.aiModelService.generate(finalPrompt);

        try {
            let jsonString = responseFromLLM;
            const match = responseFromLLM.match(/```json\n([\s\S]*?)\n```/);
            if (match && match[1]) {
                this.logger.log('Validation response was wrapped in a Markdown block. Extracting content.');
                jsonString = match[1];
            }

            return { output: 'Validation complete.', metadata: JSON.parse(jsonString) };
        } catch (error) {
            this.logger.error('Failed to parse validation JSON', { rawResponse: responseFromLLM });
            return { output: 'Validation failed.', metadata: { is_valid: false, critique: 'Failed to parse validator response.' } };
        }
    }
}
