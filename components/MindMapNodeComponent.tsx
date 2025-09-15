import React, { memo } from 'react';
import type { MindMapNode, CustomizationSettings } from '../types';
import { getNodeClasses } from '../utils/styling';
import { NODE_WIDTH } from '../utils/layout';

interface MindMapNodeProps {
    node: MindMapNode;
    onNodeSelect: (node: MindMapNode) => void;
    selectedNodeId?: string | null;
    customization: CustomizationSettings;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const MindMapNodeComponent = memo<MindMapNodeProps>(function MindMapNodeComponent({ node, onNodeSelect, selectedNodeId, customization, isExpanded, onToggleExpand }) {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === selectedNodeId;
    
    const { nodeClasses, nodeTypeClasses } = getNodeClasses(node.nodeType, customization, isSelected);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleExpand();
    }

    return (
        <div
            className={`node-card relative p-3 shadow-lg cursor-pointer transition-all duration-200 border-2 ${nodeClasses} node-entry-animation`}
            style={{ width: NODE_WIDTH }}
            onClick={() => onNodeSelect(node)}
        >
            <h3 className="text-sm font-bold text-white truncate">{node.title}</h3>
            <p className={`text-xs mt-1 truncate ${nodeTypeClasses}`}>{node.nodeType}</p>
            {hasChildren && (
                <button
                    onClick={handleToggle}
                    className="absolute -right-3 -top-3 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-transform transform hover:scale-110"
                    aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
                >
                    {isExpanded ? '−' : '+'}
                </button>
            )}
        </div>
    );
});

export default MindMapNodeComponent;