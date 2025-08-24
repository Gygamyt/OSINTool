// Определяем, какие данные агент получает на вход
export interface AgentContext {
    // Заменяем fullText на более универсальное поле data
    data: {
        fullText?: string;
        [key: string]: any; // Позволяет добавлять любые другие поля
    };
}

// Определяем, какой результат мы ожидаем от агента
export interface AgentResult {
    output: string;
    metadata?: Record<string, any>;
}

// Интерфейс, который должен реализовывать каждый агент
export interface IAgent {
    execute(context: AgentContext): Promise<AgentResult>;
}
