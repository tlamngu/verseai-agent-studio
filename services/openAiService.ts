import OpenAI from 'openai';
import { AIProvider } from './aiService';
import { LocalAIConfig, GenerationResult, ToolDefinition, RAGAction } from '../types';
import type { Content } from '@google/genai';
import { Schemas, SchemaType, geminiSchemaToJSONSchema } from '../schemas';

const isValidURL = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

const toolToOpenAITool = (tool: ToolDefinition | RAGAction): OpenAI.Chat.Completions.ChatCompletionTool => ({
    type: 'function',
    function: {
        name: tool.name.replace(/\s/g, '_'),
        description: tool.description,
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: `The input query for the ${tool.name} tool.`,
                },
            },
            required: ['query'],
        },
    },
});

export class OpenAIService implements AIProvider {
    private openai: OpenAI;
    public config: LocalAIConfig;

    constructor(config: LocalAIConfig) {
        this.config = config;
        this.openai = new OpenAI({
            apiKey: config.apiKey || 'not-needed',
            baseURL: config.baseURL,
            dangerouslyAllowBrowser: true,
        });
    }

    private handleError(error: unknown, context: string): never {
        console.error(`Error in OpenAIService (${context}):`, error);
        const message = error instanceof Error ? `(Local AI) ${error.message}` : "An unknown error occurred with the local AI provider.";
        throw new Error(message);
    }
    
    updateConfig(config: LocalAIConfig) {
        if (this.config.baseURL !== config.baseURL || this.config.apiKey !== config.apiKey) {
            this.config = config;
            this.openai = new OpenAI({
                apiKey: config.apiKey || 'not-needed',
                baseURL: config.baseURL,
                dangerouslyAllowBrowser: true,
            });
        }
    }

    async listModels(): Promise<string[]> {
        if (!isValidURL(this.config.baseURL)) {
            // Silently return empty array for invalid URL to prevent UI spam while user is typing.
            return [];
        }
        try {
            const models = await this.openai.models.list();
            return models.data.map(model => model.id).sort();
        } catch (error) {
            // Log connection errors, etc., but still return empty array to prevent UI spam.
            console.error(`Error in OpenAIService (listModels):`, error);
            return [];
        }
    }

    async generateContent(model: string, prompt: string): Promise<string> {
        if (!isValidURL(this.config.baseURL)) {
            throw new Error("Local AI Provider Base URL is not configured or is invalid.");
        }
        try {
            const completion = await this.openai.chat.completions.create({
                model: model,
                messages: [{ role: 'user', content: prompt }],
            });
            return completion.choices[0]?.message?.content || 'No response from model.';
        } catch (error) {
            this.handleError(error, 'generateContent');
        }
    }

    async generateContentWithTools(model: string, history: Content[], tools: (ToolDefinition | RAGAction)[]): Promise<GenerationResult> {
        if (!isValidURL(this.config.baseURL)) {
            throw new Error("Local AI Provider Base URL is not configured or is invalid.");
        }
        
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = history.flatMap((content): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => {
            const role = content.role === 'model' ? 'assistant' : content.role;

            if (role === 'user') {
                const textContent = content.parts.map(p => 'text' in p ? p.text : '').join('');
                return [{ role: 'user', content: textContent }];
            }
            if (role === 'assistant') {
                const assistantMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = { role: 'assistant', content: null };
                const toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];
                let textContent = '';

                content.parts.forEach(part => {
                    if ('functionCall' in part && part.functionCall) {
                        const toolCall = part.functionCall as any;
                        // Adapt for different tool call structures
                        const id = toolCall.id || toolCall.name;
                        const functionArgs = toolCall.function ? toolCall.function.arguments : (toolCall.args ? JSON.stringify(toolCall.args) : '{}');
                        const functionName = toolCall.function ? toolCall.function.name : toolCall.name;
                        
                        if (id && functionName) {
                            toolCalls.push({ id, type: 'function', function: { name: functionName, arguments: functionArgs } });
                        }
                    } else if ('text' in part) {
                        textContent += part.text;
                    }
                });

                assistantMessage.content = textContent || null;
                if (toolCalls.length > 0) assistantMessage.tool_calls = toolCalls;
                return [assistantMessage];
            }
            if (role === 'tool') {
                return content.parts.map(part => {
                    if ('functionResponse' in part && part.functionResponse) {
                        return {
                            role: 'tool' as const,
                            tool_call_id: (part.functionResponse as any).name,
                            content: JSON.stringify((part.functionResponse as any).response.result || (part.functionResponse as any).response),
                        };
                    }
                    return null;
                }).filter(Boolean) as OpenAI.Chat.Completions.ChatCompletionToolMessageParam[];
            }
            return [];
        });

        try {
            const completion = await this.openai.chat.completions.create({
                model,
                messages,
                tools: tools.length > 0 ? tools.map(toolToOpenAITool) : undefined,
            });

            const choice = completion.choices[0];
            if (choice.message.tool_calls) {
                return { toolCalls: choice.message.tool_calls, groundingMetadata: null };
            }

            return { text: choice.message.content || 'No response from model.', groundingMetadata: null };
        } catch (error) {
            this.handleError(error, 'generateContentWithTools');
        }
    }

    async generateJsonContent(model: string, prompt: string, schemaType: SchemaType): Promise<any> {
       if (!isValidURL(this.config.baseURL)) {
           throw new Error("Local AI Provider Base URL is not configured or is invalid.");
       }

       const geminiSchema = Schemas[schemaType];
       if (!geminiSchema) {
           throw new Error(`Schema for type "${schemaType}" not found.`);
       }
       const jsonSchema = geminiSchemaToJSONSchema(geminiSchema);

       let rawContent = '';
       try {
            // Use the "json_schema" response format supported by many OpenAI-compatible local servers like LM Studio
            const responseFormat = {
                type: 'json_schema',
                json_schema: {
                    name: `${schemaType}_response`,
                    strict: true,
                    schema: jsonSchema,
                }
            };

            const completion = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant designed to output JSON according to the provided schema.'
                    },
                    { role: 'user', content: prompt }
                ],
                response_format: responseFormat as any,
            });
            rawContent = completion.choices[0]?.message?.content || '';
            if (!rawContent) {
                throw new Error("Model returned an empty JSON response.");
            }
            
            // Local models can sometimes wrap output in markdown, so we'll strip it.
            const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
            const match = rawContent.match(jsonRegex);
            const jsonString = match ? match[1].trim() : rawContent.trim();

            return JSON.parse(jsonString);
        } catch (error) {
           console.error('Error in generateJsonContent logic:', error, "Raw Content:", rawContent);
           if (error instanceof SyntaxError) {
              if (schemaType === SchemaType.BUILDER_AGENT) {
                return { 
                    response: "I had trouble understanding that, as I couldn't structure the response correctly. Could you try rephrasing your request in a simpler way?", 
                    configChanges: {} 
                };
              }
              throw new Error(`Failed to parse JSON response from model: ${error.message}. Raw output: ${rawContent}`);
           }
           this.handleError(error, 'generateJsonContent');
        }
    }

    async primeModel(model: string): Promise<void> {
        if (!isValidURL(this.config.baseURL)) {
            throw new Error("Local AI Provider Base URL is not configured or is invalid.");
        }
        try {
            await this.openai.chat.completions.create({
                model: model,
                messages: [{ role: 'user', content: "This is a warm-up request. Respond with only the word 'OK'." }],
                max_tokens: 5,
            });
        } catch (error) {
            console.error(`Failed to prime model ${model}:`, error);
            throw new Error(`Failed to wake up model '${model}'. Ensure it's available and the provider is running. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}