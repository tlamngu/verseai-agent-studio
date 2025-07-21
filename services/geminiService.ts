import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type, Part, Content } from "@google/genai";
import { AIProvider } from './aiService';
import { AVAILABLE_GEMINI_MODELS } from "../constants";
import { GenerationResult, ToolDefinition, RAGAction } from "../types";
import { Schemas, SchemaType } from "../schemas";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API key not found for Google Gemini. Please set the API_KEY environment variable.");
}

const toolToFunctionDeclaration = (tool: ToolDefinition): FunctionDeclaration => ({
    name: tool.name.replace(/\s/g, '_'), // Gemini requires function names to be snake_case
    description: tool.description,
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: `The input query for the ${tool.name} tool.`,
            },
        },
        required: ["query"],
    },
});

export class GoogleGenAIService implements AIProvider {
  private ai: GoogleGenAI | null = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

  private handleError(error: unknown, context: string): never {
      console.error(`Error in GoogleGenAIService (${context}):`, error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      throw new Error(message);
  }

  async generateContent(model: string, prompt: string): Promise<string> {
    if (!this.ai) {
      throw new Error("Gemini API Key is missing or invalid.");
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
          model,
          contents: prompt,
      });
      return response.text;
    } catch (error) {
      this.handleError(error, 'generateContent');
    }
  }

  async generateContentWithTools(model: string, history: Content[], tools: (ToolDefinition | RAGAction)[]): Promise<GenerationResult> {
      if (!this.ai) {
          throw new Error("Gemini API Key is missing or invalid.");
      }

      try {
          const useGoogleSearch = tools.some(tool => tool.name === 'google_search');
          
          let toolConfig;
          if (useGoogleSearch) {
              toolConfig = { tools: [{ googleSearch: {} }] };
          } else {
              const functionDeclarations = tools.map(toolToFunctionDeclaration);
              toolConfig = functionDeclarations.length > 0 ? { tools: [{ functionDeclarations }] } : undefined;
          }

          const response = await this.ai.models.generateContent({
              model,
              contents: history,
              config: toolConfig
          });

          const functionCalls = response.candidates?.[0]?.content?.parts
              .filter(part => part.functionCall)
              .map(part => part.functionCall);

          const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

          if (functionCalls && functionCalls.length > 0) {
              return { toolCalls: functionCalls };
          }
          
          return { text: response.text, groundingMetadata };

      } catch (error) {
          this.handleError(error, 'generateContentWithTools');
      }
  }

  async generateJsonContent(model: string, prompt: string, schemaType: SchemaType): Promise<any> {
      if (!this.ai) {
          throw new Error("Gemini API Key is missing or invalid.");
      }
      
      const schema = Schemas[schemaType];
      if (!schema) {
        throw new Error(`Schema for type "${schemaType}" not found.`);
      }

      let rawText = '';
      try {
          const response: GenerateContentResponse = await this.ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema as any, // Cast because our custom interface has `nullable`
              }
          });
          
          rawText = response.text.trim();
          // Handle case where model returns empty string
          if (!rawText) {
              throw new Error("Model returned an empty JSON response.");
          }
          return JSON.parse(rawText);

      } catch (error) {
           console.error(`Error generating JSON content from Gemini for schema ${schemaType}:`, error, "Raw Text:", rawText);
           if (error instanceof SyntaxError) {
               throw new Error(`Failed to parse JSON response from model: ${error.message}. Raw output: ${rawText}`);
           }
           this.handleError(error, 'generateJsonContent');
      }
  }

  async listModels(): Promise<string[]> {
      return Promise.resolve(AVAILABLE_GEMINI_MODELS);
  }

  async primeModel(model: string): Promise<void> {
    // Cloud models don't need priming.
    return Promise.resolve();
  }
}
