import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { ToolDefinition, RAGAction, LogMessage, AgentRole } from '../types';
import { ToolExecutor } from '../services/toolExecutor';
import { PuzzlePieceIcon, BookOpenIcon, SparklesIcon } from './icons';
import { useAppContext } from '../hooks/useAppContext';
import { EDITOR_AGENT_PROMPT_TEMPLATE } from '../constants';
import { getAIProvider } from '../services/aiService';


interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const EditorAgentChatModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCodeUpdate: (newCode: string) => void;
    selectedTool: ToolDefinition | RAGAction;
    currentCode: string;
}> = ({ isOpen, onClose, onCodeUpdate, selectedTool, currentCode }) => {
    const { activeWorkspace, setLastError } = useAppContext();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: `I'm here to help you with the code for your "${selectedTool.name}" tool. What would you like to do?` }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    if (!isOpen) return null;

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        setLastError('');

        try {
            const config = activeWorkspace!.config;
            const aiProvider = getAIProvider(config);
            
            const prompt = EDITOR_AGENT_PROMPT_TEMPLATE
                .replace('{TOOL_DESCRIPTION}', selectedTool.description)
                .replace('{USER_REQUEST}', currentInput)
                .replace('{CURRENT_CODE}', currentCode);

            const model = config[AgentRole.BUILDER].model; // Use the same model as the builder agent
            const newCode = await aiProvider.generateContent(model, prompt);
            
            if (newCode && typeof newCode === 'string') {
                onCodeUpdate(newCode.trim());
                const assistantMessage: ChatMessage = { role: 'assistant', content: "I've updated the code in the editor for you. Let me know if you need anything else!" };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error("The AI returned an empty or invalid response.");
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setLastError(`Editor Agent Error: ${errorMessage}`);
            const assistantMessage: ChatMessage = { role: 'assistant', content: `I'm sorry, I encountered an error: ${errorMessage}` };
            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg border border-blue-500/50 shadow-xl p-4 max-w-2xl w-full h-2/3 flex flex-col">
                <div className="flex-shrink-0 flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold text-blue-300 flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6" />
                        Code Assistant
                    </h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div className="flex-grow bg-gray-900/50 rounded p-4 overflow-y-auto mb-4 border border-gray-700">
                    {messages.map((msg, index) => (
                         <div key={index} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap'}}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="mb-4 flex justify-start">
                             <div className="max-w-md rounded-lg px-4 py-2 bg-gray-700 text-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                <form onSubmit={handleSendMessage} className="flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 'Add a try/catch block for the API call'"
                            disabled={isLoading}
                            autoFocus
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500" disabled={isLoading || !userInput.trim()}>
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MonacoEditorWrapper = ({ code, setCode, isUnsafe }: { code: string; setCode: (c: string) => void; isUnsafe: boolean }) => {
    
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        const safeSdkLib = `
        // TYPE DEFINITIONS FOR TOOL SDK
        // These are not executable, but provide rich intellisense and validation in the editor.

        /**
         * A powerful SDK provided to help you build your tool.
         */
        declare const sdk: {
          /**
           * Logs a message to the debug panel during execution.
           * @param message The string message to log.
           * @param type The type of log message, for styling. Defaults to 'info'.
           */
          log(message: string, type?: 'info' | 'warning' | 'error' | 'action' | 'success'): void;

          /**
           * Gets the core project configuration.
           * @returns A read-only object with project name, description, and scenario.
           */
          getConfig(): { 
            readonly projectName: string; 
            readonly projectDescription: string; 
            readonly scenario: string; 
          };

          /**
           * Gets the full text from the 'Reference Data' field in the configuration.
           * @returns The reference data as a single string.
           */
          getReferenceData(): string;

          /**
           * Provides methods for making HTTP requests.
           */
          http: {
            get(url: string, headers?: object): Promise<any>;
            post(url: string, body: any, headers?: object): Promise<any>;
          };
          
          /**
           * Provides methods for making gRPC-web requests.
           */
          grpc: {
            /**
             * Makes a unary gRPC-web call to a service.
             * @param options The gRPC call options.
             * @returns A promise that resolves with the response payload as a JSON object.
             */
            call(options: {
              /** The full URL of the gRPC-web backend (e.g. 'http://localhost:8080') */
              serviceUrl: string;
              /** The string content of the .proto file defining the service. */
              protoContent: string;
              /** The full service name, including package if applicable (e.g. 'helloworld.Greeter'). */
              serviceName: string;
              /** The name of the RPC method to call (e.g. 'SayHello'). */
              methodName: string;
              /** The request payload as a JSON object, matching the request message structure. */
              requestPayload: object;
            }): Promise<any>;
          };
        };

        /**
         * The arguments passed from the LLM to your tool, parsed from JSON.
         */
        declare const args: {
          query?: string;
          [key: string]: any;
        };
        
        declare function tool(sdk: typeof sdk, args: typeof args): Promise<any>;
        `;
        
        monaco.languages.typescript.javascriptDefaults.setExtraLibs([{ content: safeSdkLib }]);

        if (isUnsafe) {
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                allowNonTsExtensions: true,
                lib: ['es2020', 'dom', 'dom.iterable'] // Enable DOM library for browser APIs
            });
        } else {
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                allowNonTsExtensions: true,
                lib: ['es2020'] // Disable DOM library
            });
        }
    };

    return (
        <div className="h-full w-full rounded-md border border-gray-600 overflow-hidden bg-gray-900">
            <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    padding: {
                        top: 16,
                        bottom: 16,
                    },
                }}
                loading={<div className="text-gray-400 text-center p-4">Loading Editor...</div>}
            />
        </div>
    );
};

const DebuggerLogPanel: React.FC<{ logs: LogMessage[] }> = ({ logs }) => {
    const logColors = {
        info: 'text-gray-400',
        action: 'text-yellow-400',
        warning: 'text-orange-400',
        error: 'text-red-400',
        success: 'text-green-400'
    };
    const endOfLogsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-gray-900/50 rounded-lg p-2 flex flex-col h-full border border-gray-700">
            <h3 className="text-md font-semibold mb-2 flex-shrink-0 text-gray-200 px-2">Output</h3>
            <div className="flex-grow overflow-y-auto font-mono text-xs pr-2">
                {logs.map((log, index) => (
                    <div key={index} className="flex px-2 py-0.5">
                        <span className="text-gray-600 mr-2 flex-shrink-0">{log.timestamp}</span>
                        <span className={`${logColors[log.type]} font-semibold w-28 flex-shrink-0`}>[{log.source}]</span>
                        <p className={`${logColors[log.type]} whitespace-pre-wrap break-words`}>{log.content}</p>
                    </div>
                ))}
                 {logs.length === 0 && <p className="text-gray-600 px-2">Run a tool to see output...</p>}
                <div ref={endOfLogsRef} />
            </div>
        </div>
    );
};

const UnlockModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg border border-red-500/50 shadow-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-300">Warning: Unlocking Full Javascript Access</h2>
            <p className="text-gray-300 mt-4">
                You are about to disable the tool execution sandbox. This will allow code in the editor to have
                full access to browser APIs, including <strong>cookies, local storage, and the ability to make
                any network request</strong>.
            </p>
            <p className="text-yellow-300 mt-4 font-semibold">
                This is a powerful feature for advanced development, but it carries risks. Only run code from sources
                you trust. Malicious code could potentially compromise your data.
            </p>
            <p className="text-gray-400 mt-4 text-sm">
                By clicking "Agree and Unlock", you acknowledge these risks and agree that you are responsible for any
                code you execute.
            </p>
            <div className="mt-6 flex justify-end space-x-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700">
                    Agree and Unlock
                </button>
            </div>
        </div>
    </div>
);

export const ToolEditorTab: React.FC = () => {
    const { activeWorkspace, updateConfig, setLastError } = useAppContext();
    const config = activeWorkspace!.config;

    const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
    const [currentCode, setCurrentCode] = useState('');
    const [testArgs, setTestArgs] = useState('{\n  "query": "test"\n}');
    const [runResults, setRunResults] = useState<LogMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    const allTools: (ToolDefinition | RAGAction)[] = [...config.tools, ...config.ragActions];
    const selectedTool = allTools.find(t => t.id === selectedToolId);
    const isCodeDirty = selectedTool && selectedTool.code !== currentCode;
    const isUnsafe = config.isUnsafeCodeExecutionEnabled;

    useEffect(() => {
        if (selectedToolId) {
            const tool = allTools.find(t => t.id === selectedToolId);
            if (tool) {
                setCurrentCode(tool.code);
            }
        } else {
            setCurrentCode('// Select a tool to begin editing');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedToolId, config.tools, config.ragActions]);

    const handleSelectTool = (tool: ToolDefinition | RAGAction) => {
        if (isCodeDirty && !window.confirm("You have unsaved changes. Are you sure you want to switch tools?")) {
            return;
        }
        setSelectedToolId(tool.id);
        setRunResults([]);
        setLastError('');
    };

    const handleSave = () => {
        if (!selectedToolId || !isCodeDirty) return;
        const isFunctionTool = config.tools.some(t => t.id === selectedToolId);
        updateConfig(prev => {
            const toolsKey = isFunctionTool ? 'tools' : 'ragActions';
            return {
                ...prev,
                [toolsKey]: prev[toolsKey].map(t => t.id === selectedToolId ? { ...t, code: currentCode } : t)
            }
        });
    };
    
    const handleRun = async () => {
        if (!selectedTool) return;
        setIsRunning(true);
        setRunResults([]);
        setLastError('');
        
        const localLog = (source: string, content: string, type: LogMessage['type'] = 'info') => {
            setRunResults(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), source, content, type }]);
        };

        let parsedArgs = {};
        try {
            parsedArgs = JSON.parse(testArgs);
            localLog('Debugger', `Starting execution with args: ${JSON.stringify(parsedArgs)}`, 'info');
        } catch(e) {
            const err = e instanceof Error ? e.message : String(e);
            const errorMessage = `Invalid JSON in arguments: ${err}`;
            localLog('Debugger', errorMessage, 'error');
            setLastError(errorMessage);
            setIsRunning(false);
            return;
        }

        try {
            const executor = new ToolExecutor(localLog);
            const result = await executor.execute(currentCode, parsedArgs, config);
            localLog('Executor', `Execution finished. Result: ${JSON.stringify(result)}`, 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during tool execution.";
            setLastError(errorMessage);
            // The executor already logs the error, so we just set the global error state
        } finally {
            setIsRunning(false);
        }
    };

    const handleConfirmUnlock = () => {
        updateConfig(prev => ({ ...prev, isUnsafeCodeExecutionEnabled: true }));
        setIsUnlockModalOpen(false);
    };

    const handleCodeUpdateFromAI = (newCode: string) => {
        setCurrentCode(newCode);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 h-full overflow-hidden">
            {isUnlockModalOpen && <UnlockModal onConfirm={handleConfirmUnlock} onCancel={() => setIsUnlockModalOpen(false)} />}
            {isChatModalOpen && selectedTool && (
                <EditorAgentChatModal
                    isOpen={isChatModalOpen}
                    onClose={() => setIsChatModalOpen(false)}
                    selectedTool={selectedTool}
                    currentCode={currentCode}
                    onCodeUpdate={handleCodeUpdateFromAI}
                />
            )}
            
            <div className="md:col-span-3 flex flex-col gap-4 bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-y-auto">
                 <div>
                    <h2 className="text-lg font-bold mb-2 text-gray-100 flex items-center gap-2">
                        <PuzzlePieceIcon className="h-5 w-5 text-teal-400" /> Function Call Tools
                    </h2>
                    <ul className="space-y-1">
                        {config.tools.map(tool => (
                            <li key={tool.id}><button onClick={() => handleSelectTool(tool)} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${selectedToolId === tool.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{tool.name || '(Unnamed Tool)'}</button></li>
                        ))}
                        {config.tools.length === 0 && <p className="text-xs text-gray-500 p-2">No function tools configured.</p>}
                    </ul>
                </div>
                <div>
                    <h2 className="text-lg font-bold mb-2 text-gray-100 flex items-center gap-2">
                        <BookOpenIcon className="h-5 w-5 text-indigo-400" /> RAG Actions
                    </h2>
                    <ul className="space-y-1">
                        {config.ragActions.map(tool => (
                            <li key={tool.id}><button onClick={() => handleSelectTool(tool)} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${selectedToolId === tool.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{tool.name || '(Unnamed Action)'}</button></li>
                        ))}
                         {config.ragActions.length === 0 && <p className="text-xs text-gray-500 p-2">No RAG actions configured.</p>}
                    </ul>
                </div>
                 <p className="text-xs text-gray-500 mt-auto pt-2">Create and name tools in the 'Configuration' tab.</p>
            </div>

            <div className="md:col-span-5 relative flex flex-col gap-2 h-full min-h-0">
                <div className="flex-shrink-0 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-100">Code Editor {isCodeDirty && <span className="text-yellow-400 text-sm">(Unsaved)</span>}</h2>
                    <button onClick={handleSave} disabled={!isCodeDirty || isRunning} className="px-4 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Save Changes</button>
                </div>
                {isUnsafe && (
                    <div className="flex-shrink-0 p-2 bg-red-900/50 text-red-300 text-xs font-semibold rounded-md border border-red-700/50 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        UNLOCKED MODE: Full Javascript access is enabled.
                    </div>
                )}
                <div className="flex-grow min-h-0">
                    <MonacoEditorWrapper key={isUnsafe ? 'unsafe' : 'safe'} code={currentCode} setCode={setCurrentCode} isUnsafe={isUnsafe} />
                </div>
                {selectedTool && (
                    <button
                        onClick={() => setIsChatModalOpen(true)}
                        className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 z-20"
                        title="Ask AI to edit code"
                    >
                        <SparklesIcon className="h-6 w-6" />
                    </button>
                )}
            </div>
            
            <div className="md:col-span-4 flex flex-col gap-4 h-full min-h-0">
                <div className="flex-shrink-0 bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h2 className="text-lg font-bold text-gray-100 mb-2">Test Runner</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Arguments (JSON)</label>
                        <textarea value={testArgs} onChange={(e) => setTestArgs(e.target.value)} rows={4} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-xs text-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-y" spellCheck="false" />
                    </div>
                    <button onClick={handleRun} disabled={!selectedToolId || isRunning} className="w-full mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500">{isRunning ? 'Running...' : 'Run Tool'}</button>
                </div>

                <div className="flex-shrink-0 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-200">Execution Mode</h3>
                    {isUnsafe ? (
                        <div className="mt-2 space-y-2">
                             <p className="text-sm text-red-300">Full Javascript access is <strong>ENABLED</strong>.</p>
                             <button onClick={() => updateConfig(prev => ({ ...prev, isUnsafeCodeExecutionEnabled: false }))} className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500">Lock and Restore Sandbox</button>
                        </div>
                    ) : (
                        <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-400">Code is executed in a sandboxed environment.</p>
                            <button onClick={() => setIsUnlockModalOpen(true)} className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700">Unlock Full Javascript Access...</button>
                        </div>
                    )}
                </div>

                <div className="flex-grow min-h-0">
                    <DebuggerLogPanel logs={runResults} />
                </div>
            </div>
        </div>
    );
};