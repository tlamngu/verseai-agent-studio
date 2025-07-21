import React, { useState, useMemo, useRef } from 'react';
import { Tab, Workspace } from './types';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import { TabButton } from './components/TabButton';
import { ConfigurationTab } from './components/ConfigurationTab';
import { GenerationTab } from './components/GenerationTab';
import { DatasetManagementTab } from './components/DatasetManagementTab';
import { ToolEditorTab } from './components/ToolEditorTab';
import { HelpTab } from './components/HelpTab';
import { StatusBar } from './components/StatusBar';
import { CogIcon, BeakerIcon, DocumentDuplicateIcon, PlayIcon, WrenchScrewdriverIcon, QuestionMarkCircleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './components/icons';
import { downloadFile } from './utils';
import { WorkspaceManagerMenu } from './components/WorkspaceManagerMenu';

const AppContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>(Tab.CONFIGURATION);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        activeWorkspace,
        workspaces,
        setActiveWorkspaceId,
        createWorkspace,
        deleteWorkspace,
        renameWorkspace,
        importWorkspace,
        setLastError
    } = useAppContext();
    
    // Using a key on GenerationTab to force re-mount and state reset on workspace switch
    const generationTabKey = useMemo(() => `gen-tab-${activeWorkspace?.id}`, [activeWorkspace]);

    if (!activeWorkspace) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                Loading Workspace...
            </div>
        );
    }

    const handleExportWorkspace = () => {
        if (!activeWorkspace) return;
        const content = JSON.stringify(activeWorkspace, null, 2);
        const filename = `${activeWorkspace.config.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workspace.json`;
        downloadFile(filename, content, 'application/json');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
        setLastError('');
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                
                const data: Partial<Workspace> = JSON.parse(text);

                if (data.config && data.datasets !== undefined && data.builderMessages !== undefined &&
                    typeof data.config.projectName === 'string' &&
                    Array.isArray(data.datasets) &&
                    Array.isArray(data.builderMessages)) {
                    
                    importWorkspace(data as Workspace);
                    alert(`Workspace "${data.config.projectName}" imported successfully!`);
                    
                } else {
                    throw new Error("Invalid workspace file format. The file is missing required fields.");
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error("Error importing workspace:", error);
                alert(`Failed to import workspace: ${errorMessage}`);
                setLastError(`Import failed: ${errorMessage}`);
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const tabIcons: Record<Tab, React.ReactNode> = {
        [Tab.CONFIGURATION]: <CogIcon className="h-5 w-5" />,
        [Tab.GENERATION]: <BeakerIcon className="h-5 w-5" />,
        [Tab.DATASETS]: <DocumentDuplicateIcon className="h-5 w-5" />,
        [Tab.TOOL_EDITOR]: <WrenchScrewdriverIcon className="h-5 w-5" />,
        [Tab.HELP]: <QuestionMarkCircleIcon className="h-5 w-5" />,
    };

    const renderContent = () => {
        switch (activeTab) {
            case Tab.CONFIGURATION:
                return <ConfigurationTab />;
            case Tab.GENERATION:
                return <GenerationTab key={generationTabKey} />;
            case Tab.DATASETS:
                return <DatasetManagementTab />;
            case Tab.TOOL_EDITOR:
                return <ToolEditorTab />;
            case Tab.HELP:
                return <HelpTab />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-200">
            <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 flex items-center justify-between p-2">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 pl-2">
                        <PlayIcon className="h-6 w-6 text-blue-500" />
                        <h1 className="text-lg font-bold text-gray-100">VerseAI Agent Studio</h1>
                    </div>
                    <nav className="flex items-center space-x-1 bg-gray-900 p-1 rounded-lg">
                        {Object.values(Tab).map(tab => (
                            <TabButton
                                key={tab}
                                label={tab}
                                icon={tabIcons[tab]}
                                isActive={activeTab === tab}
                                onClick={() => handleTabClick(tab)}
                            />
                        ))}
                    </nav>
                </div>
                <div className="flex items-center space-x-2">
                    <WorkspaceManagerMenu
                        workspaces={workspaces}
                        activeWorkspaceId={activeWorkspace.id}
                        onSwitch={setActiveWorkspaceId}
                        onCreate={createWorkspace}
                        onDelete={deleteWorkspace}
                        onRename={renameWorkspace}
                    />
                     <button
                        onClick={handleImportClick}
                        className="p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                        title="Import Workspace"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleExportWorkspace}
                        className="p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                        title="Export Active Workspace"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                </div>
            </header>
            <main className="flex-grow overflow-hidden">
                {renderContent()}
            </main>
            <StatusBar />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json,application/json"
            />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;