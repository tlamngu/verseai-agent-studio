import React, { useState, useEffect } from 'react';
import { Dataset, ConversationTurn } from '../types';
import { downloadFile } from '../utils';
import { useAppContext } from '../hooks/useAppContext';

export const DatasetManagementTab: React.FC = () => {
  const { activeWorkspace } = useAppContext();
  const datasets = activeWorkspace?.datasets || [];
  
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [selectedTurn, setSelectedTurn] = useState<ConversationTurn | null>(null);

  useEffect(() => {
    // When datasets change (e.g., a new one is saved), update the selection
    if (datasets.length > 0 && !selectedDataset) {
        setSelectedDataset(datasets[datasets.length - 1]);
    } else if (selectedDataset && !datasets.find(d => d.id === selectedDataset.id)) {
        // If the selected dataset was deleted, select the latest one
        setSelectedDataset(datasets.length > 0 ? datasets[datasets.length - 1] : null);
    }
  }, [datasets, selectedDataset]);

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setSelectedTurn(null);
  };
  
  const exportToJSON = () => {
    if (!selectedDataset) return;
    const content = JSON.stringify(selectedDataset, null, 2);
    downloadFile(`${selectedDataset.name}.json`, content, 'application/json');
  };

  const exportToJSONL = () => {
    if (!selectedDataset) return;
    const content = selectedDataset.turns.map(turn => JSON.stringify({
        messages: [
            { role: "user", content: turn.userPrompt.content },
            { role: "assistant", content: turn.agentResponse.content }
        ]
    })).join('\n');
    downloadFile(`${selectedDataset.name}.jsonl`, content, 'application/jsonl');
  };

  const exportToCSV = () => {
    if (!selectedDataset) return;
    const header = ['turn_id', 'quality_score', 'user_prompt', 'agent_response'];
    const rows = selectedDataset.turns.map(turn => {
        const userPrompt = `"${turn.userPrompt.content.replace(/"/g, '""')}"`;
        const agentResponse = `"${turn.agentResponse.content.replace(/"/g, '""')}"`;
        return [turn.id, turn.qualityScore, userPrompt, agentResponse].join(',');
    });
    const content = [header.join(','), ...rows].join('\n');
    downloadFile(`${selectedDataset.name}.csv`, content, 'text/csv;charset=utf-8;');
  };


  return (
    <div className="flex h-full p-4 gap-4">
        <div className="w-1/3 flex flex-col bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-100">Generated Datasets</h2>
            <div className="flex-grow overflow-y-auto pr-2">
                {datasets.length === 0 ? (
                    <p className="text-gray-500">No datasets generated yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {datasets.map(d => (
                            <li key={d.id}>
                                <button
                                    onClick={() => handleSelectDataset(d)}
                                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedDataset?.id === d.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    <p className="font-semibold">{d.name}</p>
                                    <p className="text-sm opacity-80">{d.turns.length} turns</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
        <div className="w-2/3 flex flex-col bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-gray-100">{selectedDataset ? selectedDataset.name : 'Select a Dataset'}</h2>
                {selectedDataset && (
                    <div className="space-x-2">
                        <button onClick={exportToJSON} className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700">Export JSON</button>
                        <button onClick={exportToJSONL} className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700">Export JSONL</button>
                        <button onClick={exportToCSV} className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700">Export CSV</button>
                    </div>
                )}
            </div>
            <div className="flex-grow flex overflow-hidden">
                <div className="w-1/2 overflow-y-auto p-4 border-r border-gray-700 pr-2">
                    <h3 className="text-lg font-semibold mb-3 text-gray-300">Conversation Turns</h3>
                    {selectedDataset ? (
                        <ul className="space-y-2">
                            {selectedDataset.turns.map(turn => (
                                <li key={turn.id}>
                                    <button onClick={() => setSelectedTurn(turn)} className={`w-full text-left p-2 rounded-md transition-colors ${selectedTurn?.id === turn.id ? 'bg-gray-600' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                                        <p className="truncate text-sm text-gray-300">
                                            <span className="font-semibold text-blue-400">User:</span> {turn.userPrompt.content}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500">No dataset selected.</p>}
                </div>
                <div className="w-1/2 overflow-y-auto p-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-300">Turn Details</h3>
                    {selectedTurn ? (
                        <div className="space-y-4 text-sm font-mono text-gray-300 bg-gray-900 p-4 rounded-md">
                            <div>
                                <p className="text-green-400">// User Prompt</p>
                                <p className="whitespace-pre-wrap">{selectedTurn.userPrompt.content}</p>
                            </div>
                            <div className="border-t border-gray-700 my-2"></div>
                             <div>
                                <p className="text-blue-400">// Agent Response</p>
                                <p className="whitespace-pre-wrap">{selectedTurn.agentResponse.content}</p>
                            </div>
                        </div>
                    ) : <p className="text-gray-500">Select a turn to see details.</p>}
                </div>
            </div>
        </div>
    </div>
  );
};