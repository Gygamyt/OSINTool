import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { env } from '../config/env';

@Injectable()
export class AiModelService {
    private readonly logger = new Logger(AiModelService.name);
    private readonly google;

    constructor() {
        // Инициализируем клиент Google AI с нашим ключом из .env
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
        this.logger.debug('Generating text with Google AI...');
        try {
            const { text } = await generateText({
                // Укажите модель, которую хотите использовать, например, 'gemini-1.5-flash'
                model: this.google('models/gemini-1.5-flash-latest'),
                prompt: prompt,
            });

            this.logger.debug('Text generation successful.');
            return text;
        } catch (error) {
            this.logger.error('Error generating text with Google AI', error);
            // В реальном приложении здесь должна быть более сложная обработка ошибок
            throw new Error('Failed to generate text');
        }
    }
}
