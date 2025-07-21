import { Type } from '@google/genai';
import { FunctionDeclarationSchema } from './types';

export enum SchemaType {
    BUILDER_AGENT = 'builderAgent',
    WATCHER_AGENT = 'watcherAgent',
}

const ToolSchema: FunctionDeclarationSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        code: { type: Type.STRING },
    },
    required: ['id', 'name', 'description', 'code'],
};

export const BuilderAgentResponseSchema: FunctionDeclarationSchema = {
    type: Type.OBJECT,
    properties: {
        response: {
            type: Type.STRING,
            description: 'A friendly, conversational reply to the user, explaining what you\'ve updated. Acknowledge their request and confirm the changes. If you think reference data is needed, suggest it.',
        },
        configChanges: {
            type: Type.OBJECT,
            description: 'A JSON object containing ONLY the keys that need to be updated.',
            properties: {
                projectDescription: {
                    type: Type.STRING,
                    description: 'The high-level goal (e.g., "A helpful customer support chatbot").',
                    nullable: true,
                },
                scenario: {
                    type: Type.STRING,
                    description: 'A specific context for conversations (e.g., "The user is asking about a missing order").',
                    nullable: true,
                },
                referenceData: {
                    type: Type.STRING,
                    description: 'A knowledge base for the agents (e.g., sample poems, API documentation, product info).',
                    nullable: true,
                },
                tools: {
                    type: Type.ARRAY,
                    description: "The complete list of ALL function call tools. To modify a tool, include its updated version here. To add a tool, include it in the list. To delete a tool, omit it from the list.",
                    items: ToolSchema,
                    nullable: true,
                },
                ragActions: {
                    type: Type.ARRAY,
                    description: "The complete list of ALL RAG actions. To modify an action, include its updated version here. To add an action, include it in the list. To delete an action, omit it from the list.",
                    items: ToolSchema,
                    nullable: true,
                }
            },
        },
    },
    required: ['response', 'configChanges'],
};

export const WatcherQualityResponseSchema: FunctionDeclarationSchema = {
    type: Type.OBJECT,
    properties: {
        qualityScore: {
            type: Type.NUMBER,
            description: 'A numeric quality score from 0 to 100 for the agent\'s response.',
        },
    },
    required: ['qualityScore'],
};

export const Schemas: Record<SchemaType, FunctionDeclarationSchema> = {
    [SchemaType.BUILDER_AGENT]: BuilderAgentResponseSchema,
    [SchemaType.WATCHER_AGENT]: WatcherQualityResponseSchema,
};

/**
 * Converts a Gemini API schema to a standard JSON Schema object.
 * This is a simplified conversion and may not cover all edge cases.
 * @param geminiSchema The schema in Gemini's format.
 * @returns An object conforming to JSON Schema.
 */
export const geminiSchemaToJSONSchema = (geminiSchema: FunctionDeclarationSchema): object => {
    const convert = (schemaPart: FunctionDeclarationSchema): any => {
        if (!schemaPart) return {};

        const jsonSchemaPart: any = {};
        
        switch (schemaPart.type) {
            case Type.STRING: jsonSchemaPart.type = 'string'; break;
            case Type.NUMBER: jsonSchemaPart.type = 'number'; break;
            case Type.INTEGER: jsonSchemaPart.type = 'integer'; break;
            case Type.BOOLEAN: jsonSchemaPart.type = 'boolean'; break;
            case Type.NULL: jsonSchemaPart.type = 'null'; break;
            case Type.OBJECT:
                jsonSchemaPart.type = 'object';
                if (schemaPart.properties) {
                    jsonSchemaPart.properties = {};
                    for (const key in schemaPart.properties) {
                        jsonSchemaPart.properties[key] = convert(schemaPart.properties[key]);
                    }
                }
                if (schemaPart.required) {
                    jsonSchemaPart.required = schemaPart.required;
                }
                break;
            case Type.ARRAY:
                jsonSchemaPart.type = 'array';
                if (schemaPart.items) {
                    jsonSchemaPart.items = convert(schemaPart.items);
                }
                break;
            default: break;
        }

        if (schemaPart.description) {
            jsonSchemaPart.description = schemaPart.description;
        }
        
        if (schemaPart.nullable) {
             jsonSchemaPart.type = [jsonSchemaPart.type, 'null'];
        }

        return jsonSchemaPart;
    };

    return convert(geminiSchema);
};