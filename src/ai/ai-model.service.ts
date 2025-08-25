import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { env } from '../config/env';

@Injectable()
export class AiModelService {
  private readonly google: any;

  constructor() {
    this.google = createGoogleGenerativeAI({
      apiKey: env.GOOGLE_API_KEY,
    });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.google(env.AI_MODEL_NAME),
        prompt: prompt,
      });
      return text;
    } catch (error) {
      throw new Error("Failed to generate text");
    }
  }
}
