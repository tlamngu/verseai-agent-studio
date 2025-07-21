import React, { useRef, useCallback, useEffect } from 'react';
import type { Part, Content } from '@google/genai';
import { GenerationStatus, AgentRole, Message, ToolDefinition, RAGAction, ConversationTurn } from '../types';
import { getAIProvider } from '../services/aiService';
import { ToolExecutor } from '../services/toolExecutor';
import { WATCHER_QUALITY_PROMPT_TEMPLATE } from '../constants';
import { UserCircleIcon, CpuChipIcon, EyeIcon, BookOpenIcon } from './icons';
import { useAppContext } from '../hooks/useAppContext';
import { SchemaType } from '../schemas';

const AgentMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === AgentRole.USER || message.role === 'user';
    const Icon = isUser ? UserCircleIcon : CpuChipIcon;
    const bgColor = isUser ? 'bg-blue-900/20' : 'bg-gray-700/30';
    const borderColor = isUser ? 'border-blue-500/30' : 'border-gray-500/30';
    const agentName = isUser ? 'User' : 'Agent LLM';

    const sources = message.groundingMetadata?.groundingChunks;

    return (
        <div className={`p-4 rounded-lg border ${bgColor} ${borderColor}`}>
            <div className="flex items-center mb-2">
                <Icon className={`h-6 w-6 mr-2 ${isUser ? 'text-blue-400' : 'text-green-400'}`} />
                <span className="font-semibold text-sm">{agentName}</span>
                <span className="text-xs text-gray-500 ml-auto">{message.timestamp}</span>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
            {sources && sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-600/50">
                    <h4 className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                        <BookOpenIcon className="h-4 w-4" />
                        Sources
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {sources.map((source: any, index: number) => (
                            <a 
                                key={index} 
                                href={source.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-blue-300 px-2 py-1 rounded-md transition-colors"
                                title={source.web.title}
                            >
                                {index + 1}. {source.web.title || new URL(source.web.uri).hostname}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LogPanel: React.FC = () => {
    const { logs } = useAppContext();
    const logColors = {
        info: 'text-gray-400',
        action: 'text-yellow-400',
        warning: 'text-orange-400',
        error: 'text-red-400',
        success: 'text-green-400',
    };
    const endOfLogsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col h-full border border-gray-700">
            <h3 className="text-lg font-semibold mb-3 flex-shrink-0 text-gray-200">Action Log</h3>
            <div className="flex-grow overflow-y-auto font-mono text-xs pr-2">
                {logs.map((log, index) => (
                    <div key={index} className="flex">
                        <span className="text-gray-600 mr-2">{log.timestamp}</span>
                        <span className={`${logColors[log.type]} font-semibold w-28 flex-shrink-0`}>[{log.source}]</span>
                        <p className={`${logColors[log.type]} whitespace-pre-wrap break-words`}>{log.content}</p>
                    </div>
                ))}
                <div ref={endOfLogsRef} />
            </div>
        </div>
    );
};

export const GenerationTab: React.FC = () => {
    const { 
        activeWorkspace, 
        status, 
        setStatus, 
        addLog, 
        setLastError,
        currentConversation,
        setCurrentConversation,
        saveConversationToDataset
    } = useAppContext();
    
    const generationState = useRef<{ isRunning: boolean, turnCount: number, maxTurns: number }>({ isRunning: false, turnCount: 0, maxTurns: 10 });
    const toolExecutorRef = useRef<ToolExecutor | null>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const config = activeWorkspace!.config;
    const conversation = currentConversation;
    const setConversation = setCurrentConversation;

    const stopWithError = useCallback((errorMessage: string) => {
        addLog('System', errorMessage, 'error');
        setLastError(errorMessage);
        setStatus(GenerationStatus.ERROR);
        generationState.current.isRunning = false;
    }, [addLog, setLastError, setStatus]);

    useEffect(() => {
        toolExecutorRef.current = new ToolExecutor((source, content, type) => addLog(source, content, type));
        addLog('System', 'Tool executor initialized.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addLog]);
    
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation]);

    const runGenerationCycle = useCallback(async () => {
        if (!generationState.current.isRunning) return;

        try {
            const aiProvider = getAIProvider(config);
            const availableTools: (ToolDefinition | RAGAction)[] = [...config.ragActions, ...config.tools];
            
            // 1. User Agent generates a prompt
            const conversationHistoryText = conversation.map(turn => `User: ${turn.userPrompt.content}\nAgent: ${turn.agentResponse.content}`).join('\n\n');
            addLog('User Agent', 'Generating prompt...');
            const userAgentPrompt = config[AgentRole.USER].prompt
                .replace('{PROJECT_GOAL}', config.projectDescription)
                .replace('{SCENARIO}', config.scenario)
                .replace('{REFERENCE_DATA}', config.referenceData || 'N/A')
                .replace('{HISTORY}', conversationHistoryText || 'N/A');
            addLog('User Agent', `Raw prompt:\n---\n${userAgentPrompt}\n---`, 'info');
            const userPromptContent = await aiProvider.generateContent(config[AgentRole.USER].model, userAgentPrompt);

            const userMessage: Message = { role: 'user', content: userPromptContent, timestamp: new Date().toLocaleTimeString() };
            addLog('User Agent', `Generated prompt: "${userPromptContent}"`, 'action');

            // 2. Agent LLM generates a response, potentially using tools
            addLog('Agent LLM', 'Thinking...');
            const agentHistory: Content[] = conversation.flatMap(turn => [
                 { role: 'user', parts: [{ text: turn.userPrompt.content }] },
                 { role: 'model', parts: [{ text: turn.agentResponse.content }] }
            ]);
            agentHistory.push({ role: 'user', parts: [{ text: userPromptContent }] });
            addLog('Agent LLM', `Request history:\n---\n${JSON.stringify(agentHistory, null, 2)}\n---`, 'info');
            
            let agentResponseContent: string | undefined;
            let finalAgentMessage: Message | undefined;
            let groundingMetadata: any;

            while (generationState.current.isRunning) {
                const result = await aiProvider.generateContentWithTools(config[AgentRole.AGENT_LLM].model, agentHistory, availableTools);
                
                if (result.groundingMetadata) {
                    groundingMetadata = result.groundingMetadata;
                    addLog('Agent LLM', 'Retrieved web search results.', 'action');
                }

                if (result.text) {
                    agentResponseContent = result.text;
                    addLog('Agent LLM', `Responded: "${agentResponseContent}"`, 'action');
                    const lastAgentPart = agentHistory[agentHistory.length - 1];
                    finalAgentMessage = { 
                        role: 'assistant', 
                        content: agentResponseContent, 
                        timestamp: new Date().toLocaleTimeString(),
                        toolCalls: 'toolCalls' in lastAgentPart ? (lastAgentPart as any).toolCalls : undefined,
                        groundingMetadata: groundingMetadata
                    };
                    break; 
                } else if (result.toolCalls) {
                    addLog('Agent LLM', `Requested to call ${result.toolCalls.length} tool(s).`, 'action');
                    agentHistory.push({ role: 'model', parts: result.toolCalls.map(tc => ({ functionCall: tc as any })) });
                    
                    const toolResponses: Part[] = [];
                    for (const toolCall of result.toolCalls) {
                        const toolToRun = availableTools.find(t => t.name.replace(/\s/g, '_') === (toolCall.name || toolCall.function?.name));
                        const toolName = toolToRun?.name || (toolCall.name || toolCall.function?.name);
                        
                        if (toolToRun) {
                            addLog('Tool Executor', `Executing tool: ${toolName}`);
                            const args = toolCall.args || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {});
                            const toolResult = await toolExecutorRef.current!.execute(toolToRun.code, args, config);
                            addLog('Tool Executor', `Result from ${toolName}: ${JSON.stringify(toolResult)}`, 'action');
                            
                            const responseName = toolCall.id || toolCall.name; 
                            toolResponses.push({
                                functionResponse: {
                                    name: responseName,
                                    response: { result: toolResult },
                                }
                            });
                        } else {
                            addLog('Tool Executor', `Tool not found: ${toolName}`, 'error');
                            const responseName = toolCall.id || toolCall.name;
                            toolResponses.push({
                                functionResponse: {
                                    name: responseName,
                                    response: { error: `Tool with name ${toolName} not found.` },
                                }
                            });
                        }
                    }
                    agentHistory.push({ role: 'tool', parts: toolResponses });

                } else {
                    throw new Error('Agent LLM returned an empty response.');
                }
            }

            if (!agentResponseContent || !finalAgentMessage) {
                if (generationState.current.isRunning) throw new Error('Failed to get a final response from Agent LLM.');
                return;
            }

            // 3. Watcher evaluates quality
            addLog('Watcher Agent', 'Evaluating quality...');
            const qualityPrompt = WATCHER_QUALITY_PROMPT_TEMPLATE
                .replace('{PROJECT_GOAL}', config.projectDescription)
                .replace('{USER_PROMPT}', userPromptContent)
                .replace('{AGENT_RESPONSE}', agentResponseContent);
            addLog('Watcher Agent', `Raw prompt:\n---\n${qualityPrompt}\n---`, 'info');
            const qualityResult = await aiProvider.generateJsonContent(config[AgentRole.WATCHER].model, qualityPrompt, SchemaType.WATCHER_AGENT);
            
            let qualityScore = 0;
            let scoreIsValid = false;

            if (qualityResult && typeof qualityResult.qualityScore === 'number') {
                qualityScore = qualityResult.qualityScore;
                scoreIsValid = true;
            }

            if(scoreIsValid) {
                addLog('Watcher Agent', `Quality score: ${qualityScore}`, 'action');
            } else {
                addLog('Watcher Agent', `Could not get a valid quality score. Raw response: ${JSON.stringify(qualityResult)}. Defaulting to 0.`, 'warning');
            }
            
            const newTurn: ConversationTurn = {
                id: `turn-${Date.now()}`,
                userPrompt: userMessage,
                agentResponse: finalAgentMessage,
                qualityScore: qualityScore,
            };
            
            setConversation(prev => [...prev, newTurn]);
            generationState.current.turnCount += 1;

            if (generationState.current.turnCount >= generationState.current.maxTurns) {
                addLog('System', `Generation complete. ${generationState.current.maxTurns} turns generated.`, 'success');
                setStatus(GenerationStatus.COMPLETED);
                generationState.current.isRunning = false;
            } else if (generationState.current.isRunning) {
                setTimeout(() => runGenerationCycle(), 100);
            }
        } catch(error) {
            stopWithError(error instanceof Error ? error.message : "An unknown error occurred during generation cycle.");
        }
    }, [config, setStatus, setConversation, addLog, conversation, stopWithError]);
    
    const handleStart = async () => {
        setConversation([]);
        setStatus(GenerationStatus.RUNNING);
        addLog('System', 'Generation process started.');

        try {
            const aiProvider = getAIProvider(config);
            const modelsToPrime = [...new Set([config[AgentRole.USER].model, config[AgentRole.AGENT_LLM].model, config[AgentRole.WATCHER].model])];

            for (const model of modelsToPrime) {
                addLog('System', `Waking up model: ${model}...`);
                await aiProvider.primeModel(model);
            }
            
            addLog('System', 'AI agents are ready. Starting generation...', 'success');
            generationState.current.isRunning = true;
            runGenerationCycle();
        } catch (error) {
            stopWithError(`Error during preparation: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    
    const handleStop = () => {
        generationState.current.isRunning = false;
        setStatus(GenerationStatus.STOPPED);
        addLog('System', 'Generation stopped by user.', 'warning');
    };

    return (
        <div className="flex flex-col h-full p-4 bg-gray-900">
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-4 border border-gray-700">
                <div className="flex items-center space-x-4">
                    <button onClick={handleStart} disabled={status === GenerationStatus.RUNNING} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">Start Generation</button>
                    <button onClick={handleStop} disabled={status !== GenerationStatus.RUNNING} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">Stop</button>
                    <button onClick={saveConversationToDataset} disabled={conversation.length === 0 || status === GenerationStatus.RUNNING} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">Save Dataset</button>
                </div>
                <div className="text-right">
                    <p className="font-mono text-sm text-gray-400">Status: <span className={`font-semibold ${status === GenerationStatus.ERROR ? 'text-red-400' : 'text-yellow-400'}`}>{status}</span></p>
                    <p className="font-mono text-sm text-gray-400">Turns: <span className="font-semibold text-gray-200">{generationState.current.turnCount} / {generationState.current.maxTurns}</span></p>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4 overflow-y-auto border border-gray-700">
                    {conversation.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Conversation log will appear here...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {conversation.map((turn) => (
                                <div key={turn.id}>
                                    <AgentMessage message={turn.userPrompt} />
                                    <AgentMessage message={turn.agentResponse} />
                                    <div className="flex justify-end my-2">
                                        <div className="flex items-center space-x-2 bg-gray-700 px-2 py-1 rounded-full text-xs">
                                            <EyeIcon className="h-4 w-4 text-purple-400" />
                                            <span>Quality Score:</span>
                                            <span className="font-bold text-white">{turn.qualityScore ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                    <hr className="border-gray-700 my-4" />
                                </div>
                            ))}
                        </div>
                    )}
                    <div ref={endOfMessagesRef} />
                </div>

                <div className="lg:col-span-1 overflow-hidden">
                    <LogPanel />
                </div>
            </div>
        </div>
    );
};
