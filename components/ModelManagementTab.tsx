import React, { useState, useEffect } from 'react';
import { ProjectConfig, AgentRole, AIProviderType } from '../types';
import { AVAILABLE_GEMINI_MODELS } from '../constants';
import { getAIProvider } from '../services/aiService';
import { UserCircleIcon, CpuChipIcon, EyeIcon, LightBulbIcon } from './icons';

interface ModelManagementTabProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
}

const AgentModelRow: React.FC<{
    agentRole: AgentRole,
    config: ProjectConfig,
    setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>,
    models: string[],
    isLocalProvider: boolean,
}> = ({ agentRole, config, setConfig, models, isLocalProvider }) => {
    
    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setConfig(prev => ({
            ...prev,
            [agentRole]: { ...prev[agentRole], model: e.target.value }
        }));
    };

    const AgentIcon = {
        [AgentRole.USER]: <UserCircleIcon className="h-6 w-6 text-blue-400" />,
        [AgentRole.AGENT_LLM]: <CpuChipIcon className="h-6 w-6 text-green-400" />,
        [AgentRole.WATCHER]: <EyeIcon className="h-6 w-6 text-purple-400" />,
        [AgentRole.BUILDER]: <LightBulbIcon className="h-6 w-6 text-yellow-400" />,
    }[agentRole];

    return (
        <tr className="border-b border-gray-700">
            <td className="p-4">
                <div className="flex items-center space-x-3">
                    {AgentIcon}
                    <span className="font-semibold">{agentRole}</span>
                </div>
            </td>
            <td className="p-4">
                <select
                    value={config[agentRole].model}
                    onChange={handleModelChange}
                    disabled={isLocalProvider && models.length === 0}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                    {isLocalProvider && models.length === 0 ? (
                        <option>No models loaded</option>
                    ) : (
                        models.map(model => <option key={model} value={model}>{model}</option>)
                    )}
                </select>
            </td>
        </tr>
    );
};


export const ModelManagementTab: React.FC<ModelManagementTabProps> = ({ config, setConfig }) => {
    const [models, setModels] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchModels = async () => {
            setIsLoading(true);
            const provider = getAIProvider(config);
            try {
                const modelList = await provider.listModels();
                setModels(modelList);
            } catch (error) {
                console.error("Failed to fetch models:", error);
                setModels([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchModels();
    }, [config]);

    const isLocalProvider = config.aiProvider === AIProviderType.LOCAL_OPENAI;
    const allModels = isLocalProvider ? models : AVAILABLE_GEMINI_MODELS;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Model Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-3">Agent-Model Assignments</h2>
                    <p className="text-sm text-gray-400 mb-4">Assign a specific model to each agent role.</p>
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th className="p-4">Agent Role</th>
                                <th className="p-4">Assigned Model</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(AgentRole).map(role => (
                                <AgentModelRow key={role} agentRole={role} config={config} setConfig={setConfig} models={allModels} isLocalProvider={isLocalProvider} />
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <h2 className="text-xl font-semibold mb-3">Available Models</h2>
                     <p className="text-sm text-gray-400 mb-4">Models available from the selected provider ({config.aiProvider}).</p>
                     {isLoading ? (
                         <p className="text-gray-400">Loading models...</p>
                     ) : (
                        <div className="max-h-96 overflow-y-auto pr-2">
                             {allModels.length > 0 ? (
                                <ul className="space-y-2">
                                    {allModels.map(model => (
                                        <li key={model} className="bg-gray-700 p-3 rounded-md font-mono text-sm">{model}</li>
                                    ))}
                                </ul>
                             ) : (
                                <p className="text-gray-400">
                                    No models found. For local providers, ensure the service is running and the Base URL is correct in the Configuration tab.
                                </p>
                             )}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};
