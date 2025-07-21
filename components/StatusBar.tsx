
import React from 'react';
import { GenerationStatus } from '../types';
import { useAppContext } from '../hooks/useAppContext';

export const StatusBar: React.FC = () => {
    const { status, lastError } = useAppContext();

    const getStatusColor = () => {
        if (lastError) return 'text-red-400';
        switch (status) {
            case GenerationStatus.RUNNING: return 'text-blue-400';
            case GenerationStatus.COMPLETED: return 'text-green-400';
            case GenerationStatus.ERROR: return 'text-red-400';
            case GenerationStatus.PAUSED:
            case GenerationStatus.STOPPED:
                return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const statusText = lastError ? 'Error' : status;
    const message = lastError || (status === GenerationStatus.IDLE ? 'Ready' : 'Working...');

    return (
        <div className="w-full bg-gray-800 border-t border-gray-700 px-4 py-1 flex items-center justify-between text-xs font-mono">
            <p>
                Status: <span className={`font-semibold ${getStatusColor()}`}>{statusText}</span>
            </p>
            <p className="text-gray-400 text-center truncate px-4 flex-1">
                {message}
            </p>
            <p className="text-gray-500">
                VerseAI Agent Studio v1.0
            </p>
        </div>
    );
};
