import { Injectable, Logger } from '@nestjs/common';
import { AgentContext, AgentResult, IAgent } from '../definitions/agent.interface';
import { AiModelService } from '../../ai'; // <--- 1. Import AiModelService

// The prompt-creating function remains unchanged
const createAttractivenessProfilerPrompt = (businessDomain = 'QA/AQA') => {
    return `
Контекст: Ты AI-аналитик.

В контексте доступны:
- исходный запрос (initial_request);
- результат парсинга (request_parser_agent_output);
- OSINT-сводка по компаниям (osint_researcher_agent_output);
- идентифицированный заказчик (customer_identifier_output).

Возможности команды Innowise:
- зрелая экспертиза по ${businessDomain} и смежным технологиям;
- AI-подходы (predictive test selection, self-healing и т.п.);
- автоматизация в CI/CD и observability-платформах;
- полный спектр задач в области ${businessDomain};
- опыт работы как со стартапами, так и с корпоративными проектами.

<ЗАДАЧА>

На основе данных сформируй аналитический отчет из шести тематических блоков.

<ПОРЯДОК РАБОТЫ>

1. Проанализируй все входные данные.
2. Сопоставь требования запроса с доменом проекта и возможностями команды.
3. Заполни блоки:
   1. Тип проекта и нужный профиль.
   2. Привлекательность вакансии.
   3. Портрет идеального кандидата.
   4. Специфические типичные задачи.
   5. Специфические дополнительные требования.
   6. Что может быть плюсом.

<ФОРМАТ ОТВЕТА>

Текст без JSON и Markdown, структурированный в короткие абзацы и списки.

<ОСОБЫЕ ТРЕБОВАНИЯ>

- Основан на фактах из запроса и OSINT.
- Выделяй потенциальные преимущества отдельно.
- Профессиональный тон.
- Не упоминать Innowise Group.
`;
};

@Injectable()
export class AttractivenessProfilerAgent implements IAgent {
    private readonly logger = new Logger(AttractivenessProfilerAgent.name);

    // <--- 2. Inject AiModelService
    constructor(private readonly aiModelService: AiModelService) {}

    async execute(context: AgentContext): Promise<AgentResult> {
        this.logger.log('Starting attractiveness profiling process with REAL AI...');

        // <--- 3. Replace mock logic with the real AI call
        // The data extraction remains the same
        const {
            initial_request,
            request_parser_agent_output,
            osint_researcher_agent_output,
            customer_identifier_output,
            businessDomain,
        } = context.data;

        // The system prompt creation also remains the same
        const systemPrompt = createAttractivenessProfilerPrompt(businessDomain);

        // Assemble the final, detailed prompt for the AI
        const finalPrompt = `
${systemPrompt}

<ВХОДНЫЕ ДАННЫЕ>

### Исходный запрос (initial_request):
${initial_request}

### Идентифицированный заказчик (customer_identifier_output):
${customer_identifier_output}

### Результат парсинга (request_parser_agent_output):
${request_parser_agent_output}

### OSINT-сводка по компаниям (osint_researcher_agent_output):
${osint_researcher_agent_output}

</ВХОДНЫЕ ДАННЫЕ>
`;

        // Call the AI service with the complete prompt
        const responseFromLLM = await this.aiModelService.generate(finalPrompt);

        this.logger.log('Attractiveness profiling process finished.');

        // Return the real result from the AI
        return {
            output: responseFromLLM,
        };
    }
}
