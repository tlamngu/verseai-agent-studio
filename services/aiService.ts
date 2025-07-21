
import { AIProviderType, ProjectConfig, GenerationResult, ToolDefinition, RAGAction } from '../types';
import { GoogleGenAIService } from './geminiService';
import { OpenAIService } from './openAiService';
import type { Content } from '@google/genai';
import { SchemaType } from '../schemas';

export interface AIProvider {
    generateContent(model: string, prompt: string): Promise<string>;
    generateContentWithTools(model: string, history: Content[], tools: (ToolDefinition | RAGAction)[]): Promise<GenerationResult>;
    generateJsonContent(model: string, prompt: string, schemaType: SchemaType): Promise<any>;
    listModels(): Promise<string[]>;
    primeModel(model: string): Promise<void>;
}

const googleInstance = new GoogleGenAIService();
let openAIInstance: OpenAIService | null = null;

export const getAIProvider = (config: ProjectConfig): AIProvider => {
    switch (config.aiProvider) {
        case AIProviderType.LOCAL_OPENAI:
            if (!openAIInstance || openAIInstance.config.baseURL !== config.localAIConfig.baseURL || openAIInstance.config.apiKey !== config.localAIConfig.apiKey) {
                openAIInstance = new OpenAIService(config.localAIConfig);
            }
            return openAIInstance;
        case AIProviderType.GOOGLE_GEMINI:
        default:
            return googleInstance;
    }
};
