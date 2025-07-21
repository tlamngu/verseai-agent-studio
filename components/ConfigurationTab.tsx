import React, { useState, useEffect, useRef } from 'react';
import { AgentRole, ProjectConfig, AIProviderType, Message, RAGAction, ToolDefinition } from '../types';
import { AVAILABLE_GEMINI_MODELS } from '../constants';
import { getAIProvider } from '../services/aiService';
import { UserCircleIcon, CpuChipIcon, EyeIcon, LightBulbIcon, BookOpenIcon, PuzzlePieceIcon } from './icons';
import { CollapsibleSection } from './CollapsibleSection';
import { useAppContext } from '../hooks/useAppContext';
import { SchemaType } from '../schemas';

interface ConfigurationTabProps {
}

const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item);

const deepMerge = (target: any, source: any) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key]) && !Array.isArray(source[key])) { // Do not merge arrays, replace them
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};


const AgentConfigCard: React.FC<{
    agentRole: AgentRole;
    config: ProjectConfig;
    setConfig: (updater: React.SetStateAction<ProjectConfig>) => void;
    availableModels: string[];
}> = ({ agentRole, config, setConfig, availableModels }) => {
    
    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConfig(prev => ({
            ...prev,
            [agentRole]: { ...prev[agentRole], prompt: e.target.value }
        }));
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setConfig(prev => ({
            ...prev,
            [agentRole]: { ...prev[agentRole], model: e.target.value }
        }));
    };

    const isLocalProvider = config.aiProvider === AIProviderType.LOCAL_OPENAI;

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    {agentRole === AgentRole.USER ? <UserCircleIcon className="h-6 w-6 text-blue-400" /> :
                     agentRole === AgentRole.AGENT_LLM ? <CpuChipIcon className="h-6 w-6 text-green-400" /> :
                     agentRole === AgentRole.WATCHER ? <EyeIcon className="h-6 w-6 text-purple-400" /> :
                     <LightBulbIcon className="h-6 w-6 text-yellow-400" />}
                    <h3 className="text-lg font-semibold text-gray-200">{agentRole}</h3>
                </div>
                 <select
                    value={config[agentRole].model}
                    onChange={handleModelChange}
                    disabled={isLocalProvider && availableModels.length === 0}
                    className="w-48 bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                    {isLocalProvider && availableModels.length === 0 ? (
                        <option>Load models...</option>
                    ) : (
                        availableModels.map(model => <option key={model} value={model}>{model}</option>)
                    )}
                </select>
            </div>
            <p className="text-sm text-gray-400 mb-2">System prompt for this agent:</p>
            {agentRole === AgentRole.WATCHER && (
                <p className="text-xs text-yellow-300/80 mb-2 p-2 bg-yellow-900/30 rounded-md border border-yellow-700/50">
                    Note: The core generation logic uses standardized internal templates for scenario creation and quality evaluation to ensure reliability. This prompt is for informational purposes and to set the agent's model.
                </p>
            )}
            {agentRole === AgentRole.BUILDER && (
                <p className="text-xs text-blue-300/80 mb-2 p-2 bg-blue-900/30 rounded-md border border-blue-700/50">
                    Note: The model for the Builder Agent can also be configured directly in the chat panel for convenience.
                </p>
            )}
            <textarea
                value={config[agentRole].prompt}
                onChange={handlePromptChange}
                className="w-full h-40 bg-gray-900 border border-gray-600 rounded-md p-3 font-mono text-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder={`Enter prompt for ${agentRole}...`}
            />
        </div>
    );
};

const BuilderAgentChat: React.FC<{ availableModels: string[] }> = ({ availableModels }) => {
    const { activeWorkspace, updateConfig, updateBuilderMessages, setLastError } = useAppContext();
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const config = activeWorkspace!.config;
    const messages = activeWorkspace!.builderMessages;
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateConfig(prev => ({
            ...prev,
            [AgentRole.BUILDER]: { ...prev[AgentRole.BUILDER], model: e.target.value }
        }));
    };

    const isLocalProvider = config.aiProvider === AIProviderType.LOCAL_OPENAI;

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;
        
        setLastError('');
        const userMessage: Message = { role: 'user', content: userInput, timestamp: new Date().toLocaleTimeString() };
        updateBuilderMessages(prev => [...prev, userMessage]);
        
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const aiProvider = getAIProvider(config);
            
            const toolsString = config.tools.length > 0 ? JSON.stringify(config.tools, null, 2) : "No tools defined.";
            const ragActionsString = config.ragActions.length > 0 ? JSON.stringify(config.ragActions, null, 2) : "No RAG actions defined.";

            const prompt = config[AgentRole.BUILDER].prompt
                .replace('{USER_MESSAGE}', currentInput)
                .replace('{PROJECT_DESCRIPTION}', config.projectDescription)
                .replace('{SCENARIO}', config.scenario)
                .replace('{REFERENCE_DATA_SNIPPET}', (config.referenceData || '').substring(0, 500))
                .replace('{IS_UNSAFE_EXECUTION_ENABLED}', String(config.isUnsafeCodeExecutionEnabled))
                .replace('{CURRENT_TOOLS}', toolsString)
                .replace('{CURRENT_RAG_ACTIONS}', ragActionsString);

            const response = await aiProvider.generateJsonContent(config[AgentRole.BUILDER].model, prompt, SchemaType.BUILDER_AGENT);
            
            if (response && typeof response.response === 'string' && typeof response.configChanges === 'object' && response.configChanges !== null) {
                const assistantMessage: Message = { role: 'assistant', content: response.response, timestamp: new Date().toLocaleTimeString() };
                updateBuilderMessages(prev => [...prev, assistantMessage]);

                if (Object.keys(response.configChanges).length > 0) {
                    updateConfig(prev => deepMerge(prev, response.configChanges));
                }
            } else {
                 const errorDetail = `Builder agent returned an invalid response shape. Expected { response: string, configChanges: object }, but got: ${JSON.stringify(response)}`;
                 setLastError(errorDetail);
                 const assistantMessage: Message = { role: 'assistant', content: "I encountered an internal error with my response format. Please try rephrasing your request.", timestamp: new Date().toLocaleTimeString() };
                 updateBuilderMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setLastError(`Builder Agent Error: ${errorMessage}`);
            const assistantMessage: Message = { role: 'assistant', content: `I encountered an error: ${errorMessage}`, timestamp: new Date().toLocaleTimeString() };
            updateBuilderMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                    <LightBulbIcon className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-gray-200">Builder Agent</h3>
                </div>
                 <select
                    value={config[AgentRole.BUILDER].model}
                    onChange={handleModelChange}
                    disabled={isLocalProvider && availableModels.length === 0}
                    className="w-48 bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    aria-label="Builder Agent Model"
                >
                    {isLocalProvider && availableModels.length === 0 ? (
                        <option>Load models...</option>
                    ) : (
                        availableModels.map(model => <option key={model} value={model}>{model}</option>)
                    )}
                </select>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap'}}>{msg.content}</p>
                            <p className="text-xs text-right opacity-60 mt-1">{msg.timestamp}</p>
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 'Make a customer support bot'"
                        disabled={isLoading}
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500" disabled={isLoading || !userInput.trim()}>
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}

const DEFAULT_TOOL_CODE = `/**
* A powerful SDK is provided to help you build your tool.
* @param {object} sdk
* @param {(message: string, type?: 'info' | 'warning' | 'error' | 'action' | 'success') => void} sdk.log - Log messages to the debug panel.
* @param {() => object} sdk.getConfig - Get project config (name, description, scenario).
* @param {() => string} sdk.getReferenceData - Get the full text from the reference data field.
* @param {object} sdk.http - Make HTTP requests.
* @param {(url: string, headers?: object) => Promise<any>} sdk.http.get - Make a GET request.
* @param {(url: string, body: any, headers?: object) => Promise<any>} sdk.http.post - Make a POST request.
* @param {object} sdk.grpc - Make gRPC-web requests.
* @param {(options: object) => Promise<any>} sdk.grpc.call - Make a unary gRPC-web call.
* @param {object} args - Arguments from the LLM.
* @returns {any} The result to return to the LLM.
*/
async function tool(sdk, args) {
  // Example: Log arguments and reference data
  sdk.log(\`Received query: \${args.query}\`, 'info');
  const projectConfig = sdk.getConfig();
  sdk.log(\`Running in project: \${projectConfig.projectName}\`, 'info');
  
  // Example: Basic search in reference data
  const refData = sdk.getReferenceData();
  if (refData.toLowerCase().includes(args.query.toLowerCase())) {
    sdk.log('Found a mention of your query in the reference data.', 'success');
    return 'Found a mention of your query in the reference data.';
  }

  // Example: Make an HTTP request
  // try {
  //   const data = await sdk.http.get('https://jsonplaceholder.typicode.com/todos/1');
  //   sdk.log(\`API Response: \${JSON.stringify(data)}\`, 'success');
  //   return data.title;
  // } catch (error) {
  //   sdk.log(\`API Error: \${error.message}\`, 'error');
  //   return 'Failed to fetch data from API.';
  // }

  return 'Tool not implemented. Replace this with your own code.';
}`;

const RAGToolConfig = <T extends RAGAction | ToolDefinition>({
  items,
  setItems,
  title,
  Icon,
  newItem,
}: {
  items: T[];
  setItems: (updater: React.SetStateAction<T[]>) => void;
  title: string;
  Icon: React.ReactNode;
  newItem: () => T;
}) => {
  const handleUpdate = (id: string, field: keyof T, value: string) => {
    setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAdd = () => {
    setItems(prevItems => [...prevItems, newItem()]);
  };

  const handleRemove = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${title.slice(0, -1)}?`)) {
        setItems(items.filter(item => item.id !== id));
    }
  };

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={false}
      headerContent={
        <div className="flex items-center space-x-2">
          {Icon}
          <span className="text-lg font-semibold text-gray-200">{title}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-md text-gray-300">#{index + 1}: {item.name || 'New Item'}</h4>
                <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">
                    Remove
                </button>
            </div>
            
            <input
              type="text"
              value={item.name}
              onChange={e => handleUpdate(item.id, 'name', e.target.value)}
              placeholder="Name (e.g., 'get_weather')"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              value={item.description}
              onChange={e => handleUpdate(item.id, 'description', e.target.value)}
              placeholder="Description for the AI to understand what this does."
              rows={2}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
            <label className="block text-sm font-medium text-gray-400">Custom Javascript Code</label>
            <textarea
              value={item.code}
              onChange={e => handleUpdate(item.id, 'code', e.target.value)}
              placeholder="Enter Javascript code here"
              rows={8}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 font-mono text-xs text-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
          </div>
        ))}
        <button onClick={handleAdd} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
          + Add New
        </button>
         <div className="text-xs text-yellow-300/80 mt-2 p-2 bg-yellow-900/30 rounded-md border border-yellow-700/50">
            <strong>Security Warning:</strong> The code you write will be executed by the system. Only use code from trusted sources. A simple SDK is provided with a `log(message)` function.
        </div>
      </div>
    </CollapsibleSection>
  );
};


export const ConfigurationTab: React.FC<ConfigurationTabProps> = () => {
    const { activeWorkspace, updateConfig, setLastError } = useAppContext();
    const [localModels, setLocalModels] = useState<string[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    
    if (!activeWorkspace) return null;

    const config = activeWorkspace.config;

    useEffect(() => {
        const fetchModels = async () => {
            if (config.aiProvider !== AIProviderType.LOCAL_OPENAI) {
                setLocalModels([]);
                return;
            }
            setIsFetchingModels(true);
            setLastError('');
            try {
                const provider = getAIProvider(config);
                const modelList = await provider.listModels();
                setLocalModels(modelList);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                setLastError(`Failed to fetch local models: ${errorMessage}`);
                setLocalModels([]);
            } finally {
                setIsFetchingModels(false);
            }
        };
        fetchModels();
    }, [config.aiProvider, config.localAIConfig.baseURL, config.localAIConfig.apiKey, setLastError]);

    const handleConfigChange = (field: keyof ProjectConfig, value: any) => {
        updateConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleLocalConfigChange = (field: keyof ProjectConfig['localAIConfig'], value: string) => {
        updateConfig(prev => ({
            ...prev,
            localAIConfig: { ...prev.localAIConfig, [field]: value }
        }));
    };
    
    const setTools = (updater: React.SetStateAction<ToolDefinition[]>) => {
        updateConfig(prev => ({
            ...prev,
            tools: typeof updater === 'function' ? updater(prev.tools) : updater
        }));
    };

    const setRagActions = (updater: React.SetStateAction<RAGAction[]>) => {
        updateConfig(prev => ({
            ...prev,
            ragActions: typeof updater === 'function' ? updater(prev.ragActions) : updater
        }));
    };

    const allModels = config.aiProvider === AIProviderType.LOCAL_OPENAI ? (isFetchingModels ? ['loading...'] : localModels) : AVAILABLE_GEMINI_MODELS;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden p-4 gap-4 bg-gray-900">
            <div className="lg:col-span-1 flex flex-col h-full">
                <BuilderAgentChat availableModels={allModels} />
            </div>

            <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-4">
                 <CollapsibleSection title="Project Details" defaultOpen={true}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Project Name</label>
                            <input
                                type="text"
                                value={config.projectName}
                                onChange={e => handleConfigChange('projectName', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Project Description (Goal)</label>
                            <textarea
                                value={config.projectDescription}
                                onChange={e => handleConfigChange('projectDescription', e.target.value)}
                                rows={3}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500 resize-y"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Base Scenario</label>
                            <textarea
                                value={config.scenario}
                                onChange={e => handleConfigChange('scenario', e.target.value)}
                                rows={3}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500 resize-y"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400">Reference Data (Knowledge Base)</label>
                            <textarea
                                value={config.referenceData}
                                onChange={e => handleConfigChange('referenceData', e.target.value)}
                                rows={6}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 font-mono text-sm text-gray-300 focus:ring-blue-500 focus:border-blue-500 resize-y"
                            />
                        </div>
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection title="AI Provider Configuration" defaultOpen={true}>
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">AI Provider</label>
                            <select
                                value={config.aiProvider}
                                onChange={e => handleConfigChange('aiProvider', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Object.values(AIProviderType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        {config.aiProvider === AIProviderType.LOCAL_OPENAI && (
                            <div className="border-t border-gray-600 pt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">Base URL</label>
                                    <input
                                        type="text"
                                        value={config.localAIConfig.baseURL}
                                        onChange={e => handleLocalConfigChange('baseURL', e.target.value)}
                                        placeholder="e.g., http://localhost:1234/v1"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">API Key (optional)</label>
                                    <input
                                        type="password"
                                        value={config.localAIConfig.apiKey}
                                        onChange={e => handleLocalConfigChange('apiKey', e.target.value)}
                                        placeholder="Usually 'not-needed' for local models"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        )}
                        {config.aiProvider === AIProviderType.GOOGLE_GEMINI && (
                             <div className="text-xs text-blue-300/80 mt-2 p-2 bg-blue-900/30 rounded-md border border-blue-700/50">
                                Note: The Google Gemini provider requires the `API_KEY` environment variable to be set in your frame's secrets.
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                <RAGToolConfig
                    items={config.tools}
                    setItems={setTools}
                    title="Function Call Tools"
                    Icon={<PuzzlePieceIcon className="h-6 w-6 text-teal-400" />}
                    newItem={() => ({
                        id: `tool-${Date.now()}`,
                        name: 'new_tool_function',
                        description: 'A new tool that can be called by the LLM.',
                        code: DEFAULT_TOOL_CODE,
                    })}
                />

                <RAGToolConfig
                    items={config.ragActions}
                    setItems={setRagActions}
                    title="RAG Actions"
                    Icon={<BookOpenIcon className="h-6 w-6 text-indigo-400" />}
                    newItem={() => ({
                        id: `rag-${Date.now()}`,
                        name: 'new_rag_action',
                        description: 'A new RAG action to retrieve information from a source.',
                        code: DEFAULT_TOOL_CODE,
                    })}
                />
                
                <CollapsibleSection title="Agent Prompts & Models" defaultOpen={false}>
                    <div className="space-y-4">
                        {Object.values(AgentRole).map(role => (
                            <AgentConfigCard
                                key={role}
                                agentRole={role}
                                config={config}
                                setConfig={updateConfig}
                                availableModels={allModels}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};