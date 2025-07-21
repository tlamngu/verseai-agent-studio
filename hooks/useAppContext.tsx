
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { GenerationStatus, LogMessage, Workspace, ProjectConfig, Dataset, Message, ConversationTurn } from '../types';
import { useWorkspaceManager } from './useWorkspaceManager';

interface AppContextType {
    // Workspace Management
    workspaces: Record<string, Workspace>;
    activeWorkspace: Workspace | null;
    activeWorkspaceId: string | null;
    setActiveWorkspaceId: (id: string) => void;
    createWorkspace: () => void;
    deleteWorkspace: (workspaceId: string) => void;
    renameWorkspace: (workspaceId: string, newName: string) => void;
    importWorkspace: (workspace: Workspace) => void;
    deleteAllWorkspaces: () => void;
    updateConfig: (updater: React.SetStateAction<ProjectConfig>) => void;
    updateDatasets: (updater: React.SetStateAction<Dataset[]>) => void;
    updateBuilderMessages: (updater: React.SetStateAction<Message[]>) => void;
    
    // Generation & Transient State
    status: GenerationStatus;
    setStatus: (status: GenerationStatus) => void;
    logs: LogMessage[];
    addLog: (source: string, content: string, type?: LogMessage['type']) => void;
    clearLogs: () => void;
    lastError: string;
    setLastError: (error: string) => void;
    
    // Live Conversation State
    currentConversation: ConversationTurn[];
    setCurrentConversation: React.Dispatch<React.SetStateAction<ConversationTurn[]>>;
    saveConversationToDataset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const workspaceManager = useWorkspaceManager();
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [lastError, setLastError] = useState<string>('');
    const [currentConversation, setCurrentConversation] = useState<ConversationTurn[]>([]);

    const clearLogs = useCallback(() => setLogs([]), []);
    
    const addLog = useCallback((source: string, content: string, type: LogMessage['type'] = 'info') => {
        const newLog: LogMessage = {
            timestamp: new Date().toLocaleTimeString(),
            source,
            content,
            type,
        };
        setLogs(prevLogs => [...prevLogs, newLog]);
    }, []);

    const handleSetStatus = (newStatus: GenerationStatus) => {
        if (newStatus !== GenerationStatus.ERROR) {
            setLastError('');
        }
        setStatus(newStatus);
    };

    const updateConfig = useCallback((updater: React.SetStateAction<ProjectConfig>) => {
        workspaceManager.updateActiveWorkspace(ws => ({
            ...ws,
            config: typeof updater === 'function' ? updater(ws.config) : updater,
        }));
    }, [workspaceManager.updateActiveWorkspace]);

    const updateDatasets = useCallback((updater: React.SetStateAction<Dataset[]>) => {
        workspaceManager.updateActiveWorkspace(ws => ({
            ...ws,
            datasets: typeof updater === 'function' ? updater(ws.datasets) : updater,
        }));
    }, [workspaceManager.updateActiveWorkspace]);
    
    const updateBuilderMessages = useCallback((updater: React.SetStateAction<Message[]>) => {
        workspaceManager.updateActiveWorkspace(ws => ({
            ...ws,
            builderMessages: typeof updater === 'function' ? updater(ws.builderMessages) : updater,
        }));
    }, [workspaceManager.updateActiveWorkspace]);
    
    const saveConversationToDataset = useCallback(() => {
        if (!workspaceManager.activeWorkspace || currentConversation.length === 0) return;
        
        const newDataset: Dataset = {
            id: `dataset-${Date.now()}`,
            name: `${workspaceManager.activeWorkspace.config.projectName} - ${new Date().toLocaleString()}`,
            createdAt: new Date().toISOString(),
            turns: currentConversation,
        };
        updateDatasets(prev => [...prev, newDataset]);
        addLog('System', `Dataset "${newDataset.name}" saved!`, 'success');
        handleSetStatus(GenerationStatus.IDLE);
    }, [workspaceManager.activeWorkspace, currentConversation, updateDatasets, addLog]);
    
    const handleSetActiveWorkspaceId = useCallback((id: string) => {
        workspaceManager.setActiveWorkspaceId(id);
        // Reset transient state when switching workspaces
        handleSetStatus(GenerationStatus.IDLE);
        clearLogs();
        setLastError('');
        setCurrentConversation([]);
    }, [workspaceManager.setActiveWorkspaceId, clearLogs]);

    const value = {
        ...workspaceManager,
        setActiveWorkspaceId: handleSetActiveWorkspaceId,
        status,
        setStatus: handleSetStatus,
        logs,
        addLog,
        clearLogs,
        lastError,
        setLastError,
        updateConfig,
        updateDatasets,
        updateBuilderMessages,
        currentConversation,
        setCurrentConversation,
        saveConversationToDataset
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};