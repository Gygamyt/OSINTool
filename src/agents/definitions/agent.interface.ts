export interface AgentContext {
    data: {
        fullText?: string;
        [key: string]: any;
    };
}

export interface AgentResult {
    output: string;
    metadata?: Record<string, any>;
}

export interface IAgent {
    execute(context: AgentContext): Promise<AgentResult>;
}
