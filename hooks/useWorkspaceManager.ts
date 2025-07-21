import { useState, useEffect, useCallback } from 'react';
import { Workspace, ProjectConfig, Message } from '../types';
import { usePersistentState } from './usePersistentState';
import { createInitialConfig, EXAMPLE_HN_QA_AGENT_WORKSPACE, EXAMPLE_GAMEDEV_ASSISTANT_WORKSPACE } from '../constants';

export const useWorkspaceManager = () => {
    const [workspaces, setWorkspaces] = usePersistentState<Record<string, Workspace>>('workspaces_v3', {});
    const [activeWorkspaceId, setActiveWorkspaceId] = usePersistentState<string | null>('activeWorkspaceId_v3', null);

    // Initialize with default workspaces if empty
    useEffect(() => {
        if (Object.keys(workspaces).length === 0) {
            console.log("No workspaces found, initializing with defaults.");
            const defaultWorkspace: Workspace = {
                id: `ws-${Date.now()}`,
                config: createInitialConfig(),
                datasets: [],
                builderMessages: [
                    { role: 'assistant', content: "Hello! I'm the Builder Agent. How can I help you set up your dataset generation project today? For example, you can say 'make a chatbot for a pirate speaking to a customer'.", timestamp: new Date().toLocaleTimeString() }
                ]
            };

            const newWorkspaces = {
                [defaultWorkspace.id]: defaultWorkspace,
                [EXAMPLE_HN_QA_AGENT_WORKSPACE.id]: EXAMPLE_HN_QA_AGENT_WORKSPACE,
                [EXAMPLE_GAMEDEV_ASSISTANT_WORKSPACE.id]: EXAMPLE_GAMEDEV_ASSISTANT_WORKSPACE
            };

            setWorkspaces(newWorkspaces);
            setActiveWorkspaceId(defaultWorkspace.id);
        }
    }, [workspaces, setWorkspaces, setActiveWorkspaceId]);

    const activeWorkspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;

    const createWorkspace = useCallback(() => {
        const newName = prompt("Enter the name for the new workspace:", "My New Project");
        if (!newName) return;

        const newConfig = createInitialConfig();
        newConfig.projectName = newName;

        const newWorkspace: Workspace = {
            id: `ws-${Date.now()}`,
            config: newConfig,
            datasets: [],
            builderMessages: [
                 { role: 'assistant', content: "Hello! How can I help you set up this new project?", timestamp: new Date().toLocaleTimeString() }
            ]
        };

        setWorkspaces(prev => ({
            ...prev,
            [newWorkspace.id]: newWorkspace
        }));
        setActiveWorkspaceId(newWorkspace.id);
    }, [setWorkspaces, setActiveWorkspaceId]);

    const deleteWorkspace = useCallback((workspaceId: string) => {
        if (Object.keys(workspaces).length <= 1) {
            alert("You cannot delete the last workspace.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the workspace "${workspaces[workspaceId].config.projectName}"? This action is irreversible.`)) {
            setWorkspaces(prev => {
                const newWorkspaces = { ...prev };
                delete newWorkspaces[workspaceId];
                return newWorkspaces;
            });

            if (activeWorkspaceId === workspaceId) {
                // Switch to another workspace
                const remainingIds = Object.keys(workspaces).filter(id => id !== workspaceId);
                setActiveWorkspaceId(remainingIds[0] || null);
            }
        }
    }, [workspaces, activeWorkspaceId, setWorkspaces, setActiveWorkspaceId]);

    const renameWorkspace = useCallback((workspaceId: string, newName: string) => {
        if (!newName.trim()) {
            alert("Workspace name cannot be empty.");
            return;
        }
        setWorkspaces(prev => ({
            ...prev,
            [workspaceId]: {
                ...prev[workspaceId],
                config: {
                    ...prev[workspaceId].config,
                    projectName: newName
                }
            }
        }));
    }, [setWorkspaces]);

    const importWorkspace = useCallback((workspaceData: Workspace) => {
        const newId = `ws-imported-${Date.now()}`;
        const workspaceToImport: Workspace = {
            ...workspaceData,
            id: newId
        };
        
        setWorkspaces(prev => ({
            ...prev,
            [newId]: workspaceToImport
        }));
        setActiveWorkspaceId(newId);

    }, [setWorkspaces, setActiveWorkspaceId]);
    
    const deleteAllWorkspaces = useCallback(() => {
        setWorkspaces({});
        setActiveWorkspaceId(null);
        // The useEffect will trigger to re-initialize defaults
        window.location.reload();
    }, [setWorkspaces, setActiveWorkspaceId]);


    const updateActiveWorkspace = useCallback((updater: (ws: Workspace) => Workspace) => {
        if (activeWorkspaceId) {
            setWorkspaces(prev => {
                const updatedWorkspace = updater(prev[activeWorkspaceId]);
                // Ensure config projectName stays in sync with workspace name
                if (updatedWorkspace.config.projectName !== prev[activeWorkspaceId].config.projectName) {
                     console.warn("Project name updated directly, should use renameWorkspace for consistency.");
                }
                return {
                    ...prev,
                    [activeWorkspaceId]: updatedWorkspace
                };
            });
        }
    }, [activeWorkspaceId, setWorkspaces]);

    return {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        setActiveWorkspaceId,
        createWorkspace,
        deleteWorkspace,
        renameWorkspace,
        importWorkspace,
        deleteAllWorkspaces,
        updateActiveWorkspace,
    };
};