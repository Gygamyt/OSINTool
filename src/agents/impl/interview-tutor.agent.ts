import { Injectable, Logger } from "@nestjs/common";
import {
  AgentContext,
  AgentResult,
  IAgent,
} from "../definitions/agent.interface";
import { AiModelService } from "../../ai/ai-model.service"; // <--- 1. Import AiModelService

// Функция createInterviewTutorPrompt остается без изменений
const createInterviewTutorPrompt = (businessDomain = "QA/AQA") => {
  return `
Контекст: Ты агент по подготовке кандидатов к собеседованию на позицию ${businessDomain}.

Входные данные доступны по ключам:
— исходный запрос;
— разбор запроса ('parsed_info');
— результаты OSINT-исследования ('osint_results');
— оценка привлекательности позиции и профиля кандидата ('attractiveness_and_profile').

<ЗАДАЧА>

Подготовь для кандидата структурированный пакет материалов:
1) 5-7 технических вопросов по стеку и задачам;
2) 3-5 поведенческих вопросов;
3) 3-4 умных вопроса кандидата к интервьюеру;
4) 2-3 совета по подготовке.

<ПОРЯДОК РАБОТЫ>

1. Проанализируй все четыре блока входных данных, выдели ключевые навыки, требования и риски.
2. Сформулируй технические вопросы, проверяющие самые критичные компетенции ${businessDomain}.
3. Подготовь поведенческие вопросы, раскрывающие soft-skills и взаимодействие в команде.
4. Составь вопросы к интервьюеру, демонстрирующие осведомленность кандидата о проекте и мотивацию.
5. Дай практические советы по подготовке (ресурсы, фокус на темах, отработка ответов).

<ФОРМАТ ОТВЕТА>

• Технические вопросы:
1. …
• Поведенческие вопросы:
1. …
• Вопросы кандидата интервьюеру:
1. …
• Советы по подготовке:
— …

Кратко, без JSON, фигурных скобок и Markdown. Используй списки и короткие фразы для читаемости.
`;
};

@Injectable()
export class InterviewTutorAgent implements IAgent {
  private readonly logger = new Logger(InterviewTutorAgent.name);

  // <--- 2. Inject AiModelService
  constructor(private readonly aiModelService: AiModelService) {}

  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.log("Starting interview tutoring process with REAL AI...");

    // <--- 3. Replace mock logic with real AI call
    // Extract all necessary data from the context
    const {
      businessDomain,
      initial_request,
      parsed_info,
      osint_results,
      attractiveness_and_profile,
    } = context.data;

    // Create the system part of the prompt
    const systemPrompt = createInterviewTutorPrompt(businessDomain);

    // Assemble the final prompt, providing all the data to the AI
    const finalPrompt = `
${systemPrompt}

<ВХОДНЫЕ ДАННЫЕ>

### Исходный запрос:
${initial_request}

### Разбор запроса:
${parsed_info}

### Результаты OSINT-исследования:
${osint_results}

### Оценка привлекательности и профиля:
${attractiveness_and_profile}

</ВХОДНЫЕ ДАННЫЕ>
`;

    // Call the AI service
    const responseFromLLM = await this.aiModelService.generate(finalPrompt);

    this.logger.log("Interview tutoring process finished.");

    // Return the real result
    return {
      output: responseFromLLM,
    };
  }
}
