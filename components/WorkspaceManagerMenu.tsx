
import React, { useState, useRef, useEffect } from 'react';
import { Workspace } from '../types';
import { ChevronDownIcon } from './icons';

interface WorkspaceManagerMenuProps {
    workspaces: Record<string, Workspace>;
    activeWorkspaceId: string;
    onSwitch: (workspaceId: string) => void;
    onCreate: () => void;
    onDelete: (workspaceId: string) => void;
    onRename: (workspaceId: string, newName: string) => void;
}

export const WorkspaceManagerMenu: React.FC<WorkspaceManagerMenuProps> = ({
    workspaces,
    activeWorkspaceId,
    onSwitch,
    onCreate,
    onDelete,
    onRename
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const activeWorkspace = workspaces[activeWorkspaceId];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleRename = () => {
        const newName = prompt("Enter new name for this workspace:", activeWorkspace.config.projectName);
        if (newName) {
            onRename(activeWorkspaceId, newName);
        }
        setIsOpen(false);
    };
    
    const handleDelete = (workspaceId: string) => {
        onDelete(workspaceId);
        setIsOpen(false);
    };

    const handleSwitch = (workspaceId: string) => {
        onSwitch(workspaceId);
        setIsOpen(false);
    };
    
    const handleCreate = () => {
        onCreate();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
            >
                <span className="text-gray-200">{activeWorkspace?.config.projectName}</span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                    <div className="py-1">
                        <div className="px-3 py-2 text-xs text-gray-400 uppercase">Switch Workspace</div>
                        {Object.values(workspaces).map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => handleSwitch(ws.id)}
                                className={`w-full text-left px-3 py-2 text-sm ${ws.id === activeWorkspaceId ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
                            >
                                {ws.config.projectName}
                            </button>
                        ))}
                         <div className="border-t border-gray-600 my-1"></div>
                        <button
                            onClick={handleCreate}
                            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            + Create New Workspace
                        </button>
                        <div className="border-t border-gray-600 my-1"></div>
                        <button
                            onClick={handleRename}
                            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            Rename Current
                        </button>
                        <button
                            onClick={() => handleDelete(activeWorkspaceId)}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white"
                        >
                            Delete Current
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
