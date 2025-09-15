// FIX: Changed 'import type' to a value import for NodeType because it's an enum used at runtime.
import { NodeType, type CustomizationSettings, type ColorPalette, type NodeShape, type ConnectorStyle } from '../types';
import { NODE_WIDTH, NODE_HEIGHT } from './layout';

type ColorDefinition = {
    bg: string;
    border: string;
    text: string;
};

const palettes: Record<ColorPalette, Record<NodeType, ColorDefinition>> = {
    default: {
        [NodeType.TOPIC]: { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-200' },
        [NodeType.SUB_TOPIC]: { bg: 'bg-sky-600', border: 'border-sky-400', text: 'text-sky-200' },
        [NodeType.DETAIL]: { bg: 'bg-teal-600', border: 'border-teal-400', text: 'text-teal-200' },
        [NodeType.FACT]: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-200' },
        [NodeType.QUOTE]: { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-200' },
        [NodeType.INSIGHT]: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-200' },
        [NodeType.QUESTION]: { bg: 'bg-pink-600', border: 'border-pink-400', text: 'text-pink-200' },
    },
    forest: {
        [NodeType.TOPIC]: { bg: 'bg-green-800', border: 'border-green-600', text: 'text-green-200' },
        [NodeType.SUB_TOPIC]: { bg: 'bg-lime-700', border: 'border-lime-500', text: 'text-lime-200' },
        [NodeType.DETAIL]: { bg: 'bg-yellow-800', border: 'border-yellow-600', text: 'text-yellow-200' },
        [NodeType.FACT]: { bg: 'bg-stone-600', border: 'border-stone-400', text: 'text-stone-200' },
        [NodeType.QUOTE]: { bg: 'bg-orange-800', border: 'border-orange-600', text: 'text-orange-200' },
        [NodeType.INSIGHT]: { bg: 'bg-teal-800', border: 'border-teal-600', text: 'text-teal-200' },
        [NodeType.QUESTION]: { bg: 'bg-cyan-800', border: 'border-cyan-600', text: 'text-cyan-200' },
    },
    ocean: {
        [NodeType.TOPIC]: { bg: 'bg-blue-800', border: 'border-blue-600', text: 'text-blue-200' },
        [NodeType.SUB_TOPIC]: { bg: 'bg-cyan-700', border: 'border-cyan-500', text: 'text-cyan-200' },
        [NodeType.DETAIL]: { bg: 'bg-sky-800', border: 'border-sky-600', text: 'text-sky-200' },
        [NodeType.FACT]: { bg: 'bg-gray-500', border: 'border-gray-400', text: 'text-gray-200' },
        [NodeType.QUOTE]: { bg: 'bg-indigo-700', border: 'border-indigo-500', text: 'text-indigo-200' },
        [NodeType.INSIGHT]: { bg: 'bg-purple-800', border: 'border-purple-600', text: 'text-purple-200' },
        [NodeType.QUESTION]: { bg: 'bg-teal-700', border: 'border-teal-500', text: 'text-teal-200' },
    },
    sunset: {
        [NodeType.TOPIC]: { bg: 'bg-red-800', border: 'border-red-600', text: 'text-red-200' },
        [NodeType.SUB_TOPIC]: { bg: 'bg-orange-700', border: 'border-orange-500', text: 'text-orange-200' },
        [NodeType.DETAIL]: { bg: 'bg-yellow-700', border: 'border-yellow-500', text: 'text-yellow-200' },
        [NodeType.FACT]: { bg: 'bg-rose-800', border: 'border-rose-600', text: 'text-rose-200' },
        [NodeType.QUOTE]: { bg: 'bg-amber-700', border: 'border-amber-500', text: 'text-amber-200' },
        [NodeType.INSIGHT]: { bg: 'bg-purple-800', border: 'border-purple-600', text: 'text-purple-200' },
        [NodeType.QUESTION]: { bg: 'bg-pink-800', border: 'border-pink-600', text: 'text-pink-200' },
    },
};

const shapeClasses: Record<NodeShape, string> = {
    rounded: 'rounded-lg',
    rectangle: 'rounded-none',
    oval: 'rounded-full',
};

export const getNodeClasses = (nodeType: NodeType, customization: CustomizationSettings, isSelected: boolean) => {
    const palette = palettes[customization.colorPalette] || palettes.default;
    const colors = palette[nodeType] || palette[NodeType.TOPIC];
    const shape = shapeClasses[customization.nodeShape] || shapeClasses.rounded;
    
    const baseClasses = `${colors.bg} ${colors.border} ${shape}`;
    const selectionClasses = isSelected ? 'scale-110 shadow-2xl ring-4 ring-offset-2 ring-offset-gray-900 ring-yellow-400' : 'hover:scale-105';

    return {
        nodeClasses: `${baseClasses} ${selectionClasses}`,
        nodeTypeClasses: colors.text
    };
};


export const getConnectorPath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    style: ConnectorStyle
): string => {
    // Adjust start and end points for better visual connection
    const startAdjusted = { x: start.x, y: start.y };
    const endAdjusted = { x: end.x, y: end.y };


    switch (style) {
        case 'curved':
            const c1x = startAdjusted.x + (endAdjusted.x - startAdjusted.x) * 0.5;
            const c1y = startAdjusted.y;
            const c2x = startAdjusted.x + (endAdjusted.x - startAdjusted.x) * 0.5;
            const c2y = endAdjusted.y;
            return `M ${startAdjusted.x},${startAdjusted.y} C ${c1x},${c1y} ${c2x},${c2y} ${endAdjusted.x},${endAdjusted.y}`;
        case 'straight':
            return `M ${startAdjusted.x},${startAdjusted.y} L ${endAdjusted.x},${endAdjusted.y}`;
        case 'elbow':
        default:
            const midX = startAdjusted.x + 30; // Extend horizontally before turning
            return `M ${startAdjusted.x},${startAdjusted.y} L ${midX},${startAdjusted.y} L ${midX},${endAdjusted.y} L ${endAdjusted.x},${endAdjusted.y}`;
    }
};