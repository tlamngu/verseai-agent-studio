import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Dataset } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface AnalyticsTabProps {
  datasets: Dataset[];
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
            labels: { color: '#e0e0e0' }
        },
        title: {
            display: true,
            color: '#ffffff',
            font: { size: 16 }
        },
    },
    scales: {
        y: {
            ticks: { color: '#999999' },
            grid: { color: '#444444' },
        },
        x: {
            ticks: { color: '#999999' },
            grid: { color: '#444444' },
        },
    },
};


export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ datasets }) => {
    if (datasets.length === 0) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-gray-400 mt-4">Generate some datasets to see analytics and quality metrics.</p>
            </div>
        );
    }
    
    const allTurns = datasets.flatMap(d => d.turns);
    const totalTurns = allTurns.length;
    const avgQuality = totalTurns > 0 ? (allTurns.reduce((acc, turn) => acc + (turn.qualityScore || 0), 0) / totalTurns) : 0;
    
    // Quality Score Trend Data
    const qualityTrendData = {
        labels: datasets.map(d => new Date(d.createdAt).toLocaleDateString()),
        datasets: [
            {
                label: 'Average Quality Score per Dataset',
                data: datasets.map(d => d.turns.length > 0 ? (d.turns.reduce((acc, t) => acc + (t.qualityScore || 0), 0) / d.turns.length) : 0),
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f6',
            }
        ]
    };

    // Conversation Length Distribution Data
    const lengthBuckets = [0, 5, 10, 15, 20];
    const lengthLabels = ['1-5', '6-10', '11-15', '16-20', '21+'];
    const lengthCounts = Array(lengthLabels.length).fill(0);
    datasets.forEach(d => {
        const len = d.turns.length;
        if (len <= 5) lengthCounts[0]++;
        else if (len <= 10) lengthCounts[1]++;
        else if (len <= 15) lengthCounts[2]++;
        else if (len <= 20) lengthCounts[3]++;
        else lengthCounts[4]++;
    });

    const lengthDistData = {
        labels: lengthLabels,
        datasets: [{
            label: '# of Datasets by Conversation Turns',
            data: lengthCounts,
            backgroundColor: '#8b5cf6',
        }]
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Total Datasets</h3>
                    <p className="text-3xl font-bold text-white">{datasets.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Total Conversation Turns</h3>
                    <p className="text-3xl font-bold text-white">{totalTurns}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium">Overall Average Quality</h3>
                    <p className="text-3xl font-bold text-green-400">{avgQuality.toFixed(1)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 h-96">
                    <Line options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'Quality Score Trend'}}}} data={qualityTrendData} />
                </div>
                <div className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 h-96">
                     <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'Conversation Length Distribution'}}}} data={lengthDistData} />
                </div>
            </div>
        </div>
    );
};