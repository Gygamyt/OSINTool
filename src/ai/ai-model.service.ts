import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { env } from '../config/env';

@Injectable()
export class AiModelService {
    private readonly logger = new Logger(AiModelService.name);
    private readonly google;

    constructor() {
        this.google = createGoogleGenerativeAI({
            apiKey: env.GOOGLE_API_KEY,
        });
        this.logger.log('Google AI Service Initialized');
    }

    /**
     * Генерирует текст на основе промпта.
     * @param prompt Полный промпт для модели.
     * @returns Сгенерированный моделью текст.
     */
    async generate(prompt: string): Promise<string> {
        try {
            const { text } = await generateText({
                model: this.google('models/gemini-1.5-flash-latest'),
                prompt: prompt,
            });
            return text;
        } catch (error) {
            throw new Error('Failed to generate text');
        }
    }
}
