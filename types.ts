import { Type } from '@google/genai';

export enum AgentRole {
    USER = 'User Agent',
    AGENT_LLM = 'Agent LLM',
    WATCHER = 'Watcher Agent',
    BUILDER = 'Builder Agent',
}

export enum Tab {
    CONFIGURATION = 'Configuration',
    GENERATION = 'Generation',
    DATASETS = 'Datasets',
    TOOL_EDITOR = 'Tool Editor',
    HELP = 'Help',
}

export enum AIProviderType {
    GOOGLE_GEMINI = 'Google Gemini',
    LOCAL_OPENAI = 'Local AI (OpenAI compatible)',
}

export interface LocalAIConfig {
    baseURL: string;
    apiKey?: string; // Often 'not-needed' for local, but good to have
}

export interface Message {
    role: AgentRole | 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: string;
    toolCalls?: any[];
    toolCallId?: string;
    groundingMetadata?: any;
}

export interface LogMessage {
    timestamp: string;
    source: string;
    content: string;
    type: 'info' | 'warning' | 'error' | 'action' | 'success';
}

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    code: string;
}

export interface RAGAction {
    id: string;
    name: string;
    description: string;
    code: string;
}

export interface ConversationTurn {
    id: string;
    userPrompt: Message;
    agentResponse: Message;
    qualityScore?: number;
}

export interface AgentConfig {
    prompt: string;
    model: string;
}

export interface ProjectConfig {
    projectName: string;
    projectDescription: string;
    scenario: string;
    referenceData: string;
    aiProvider: AIProviderType;
    localAIConfig: LocalAIConfig;
    tools: ToolDefinition[];
    ragActions: RAGAction[];
    isUnsafeCodeExecutionEnabled: boolean;
    [AgentRole.USER]: AgentConfig;
    [AgentRole.AGENT_LLM]: AgentConfig;
    [AgentRole.WATCHER]: AgentConfig;
    [AgentRole.BUILDER]: AgentConfig;
}

export interface Dataset {
    id: string;
    name: string;
    createdAt: string;
    turns: ConversationTurn[];
}

export enum GenerationStatus {
    IDLE = 'Idle',
    RUNNING = 'Running',
    PAUSED = 'Paused',
    STOPPED = 'Stopped',
    COMPLETED = 'Completed',
    ERROR = 'Error',
}

export interface GenerationResult {
    text?: string;
    toolCalls?: any[]; // The raw tool call objects from the provider
    groundingMetadata?: any;
}

export interface Workspace {
  id: string;
  config: ProjectConfig;
  datasets: Dataset[];
  builderMessages: Message[];
}

export interface FunctionDeclarationSchema {
    type: Type;
    description?: string;
    properties?: {
        [key: string]: FunctionDeclarationSchema;
    };
    required?: string[];
    items?: FunctionDeclarationSchema;
    nullable?: boolean; // Custom property for JSON Schema conversion
}
