

import React from 'react';
import type { MindMapNode } from '../types';
import { NodeType } from '../types';

interface NodeDetailPanelProps {
    node: MindMapNode;
}

const getNodeColorClasses = (nodeType: NodeType): { bg: string; text: string; border: string } => {
    switch (nodeType) {
        case NodeType.TOPIC: return { bg: 'bg-indigo-900/50', text: 'text-indigo-300', border: 'border-indigo-500' };
        case NodeType.SUB_TOPIC: return { bg: 'bg-sky-900/50', text: 'text-sky-300', border: 'border-sky-500' };
        case NodeType.DETAIL: return { bg: 'bg-teal-900/50', text: 'text-teal-300', border: 'border-teal-500' };
        case NodeType.FACT: return { bg: 'bg-emerald-900/50', text: 'text-emerald-300', border: 'border-emerald-500' };
        case NodeType.QUOTE: return { bg: 'bg-amber-900/50', text: 'text-amber-300', border: 'border-amber-500' };
        case NodeType.INSIGHT: return { bg: 'bg-purple-900/50', text: 'text-purple-300', border: 'border-purple-500' };
        case NodeType.QUESTION: return { bg: 'bg-pink-900/50', text: 'text-pink-300', border: 'border-pink-500' };
        default: return { bg: 'bg-gray-700', text: 'text-gray-300', border: 'border-gray-500' };
    }
};

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node }) => {
    const { bg, text, border } = getNodeColorClasses(node.nodeType);

    const confidencePercentage = (node.confidenceScore * 100).toFixed(0);

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex-1 flex flex-col min-h-0">
            <h2 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">Node Details</h2>
            <div className="overflow-y-auto pr-2">
                <div className="mb-4">
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${bg} ${text}`}>
                        {node.nodeType}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-100">{node.title}</h3>

                <div className="my-4">
                    <p className="text-gray-400 text-sm">{node.summary}</p>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold text-gray-300 mb-2">Key Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                        {(node.keyPoints || []).map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Confidence Score</h4>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${confidencePercentage}%` }}
                            title={`Confidence: ${confidencePercentage}%`}
                        ></div>
                    </div>
                    <p className="text-right text-xs text-gray-400 mt-1">{confidencePercentage}%</p>
                </div>
            </div>
        </div>
    );
};

export default NodeDetailPanel;