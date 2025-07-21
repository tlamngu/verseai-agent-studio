
import { LogMessage, ProjectConfig } from '../types';
import { GRPCUtil } from './grpcUtil';

type LogFunction = (source: string, content: string, type: LogMessage['type']) => void;

class HttpUtil {
    private log: LogFunction;

    constructor(log: LogFunction) {
        this.log = log;
    }

    private async request(url: string, options: RequestInit) {
        this.log('SDK.http', `Requesting ${options.method || 'GET'} ${url}`, 'info');
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = `Request failed with status ${response.status}: ${errorText}`;
            this.log('SDK.http', errorMessage, 'error');
            throw new Error(errorMessage);
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    }

    async get(url: string, headers: Record<string, string> = {}) {
        return this.request(url, { method: 'GET', headers });
    }

    async post(url: string, body: any, headers: Record<string, string> = {}) {
        const defaultHeaders = { 'Content-Type': 'application/json', ...headers };
        return this.request(url, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(body),
        });
    }
}


export class ToolExecutor {
    private log: LogFunction;

    constructor(logCallback: LogFunction) {
        this.log = logCallback;
    }

    public async execute(code: string, args: any, config: ProjectConfig): Promise<any> {
        if (config.isUnsafeCodeExecutionEnabled) {
            this.log('Tool Executor', `Executing with UNLOCKED Javascript access. This allows direct use of browser APIs.`, 'warning');
        }

        const sdk = {
            log: (message: string, type: LogMessage['type'] = 'info') => this.log('Custom Code', message, type),
            getConfig: () => ({
                projectName: config.projectName,
                projectDescription: config.projectDescription,
                scenario: config.scenario,
            }),
            getReferenceData: () => config.referenceData,
            http: new HttpUtil(this.log),
            grpc: new GRPCUtil(this.log),
        };

        try {
            const userFunction = new Function('sdk', 'args', `
                return (async () => {
                    ${code}
                    if (typeof tool !== 'function') {
                        throw new Error("'tool' function is not defined in the code.");
                    }
                    return await tool(sdk, args);
                })();
            `);

            const result = await userFunction(sdk, args);
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log('Tool Executor', `Error executing custom code: ${errorMessage}`, 'error');
            // Re-throw to be caught by the calling context (e.g., ToolEditorTab runner)
            throw new Error(`Tool execution failed: ${errorMessage}`);
        }
    }
}
