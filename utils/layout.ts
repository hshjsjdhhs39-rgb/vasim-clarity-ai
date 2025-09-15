import type { MindMapNode } from '../types';

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 90;
const VERTICAL_SPACING = 30;

export interface PositionedMindMapNode extends MindMapNode {
    x: number;
    y: number;
    modifier: number; // For the second pass of the algorithm
    width: number;
    height: number;
    // FIX: Override children to be of type PositionedMindMapNode[] to resolve type errors
    // when accessing properties on child nodes within the layout algorithm.
    children: PositionedMindMapNode[];
}

interface Connector {
    source: { id: string; x: number; y: number };
    target: { id: string; x: number; y: number };
}

// A simplified version of the Buchheim-Walker algorithm
export const calculateLayout = (root: MindMapNode, expandedNodes: Set<string>) => {
    const positionedNodes: PositionedMindMapNode[] = [];
    const connectors: Connector[] = [];

    let minY = Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;

    function firstPass(node: MindMapNode, depth: number, parent?: PositionedMindMapNode): PositionedMindMapNode {
        const isExpanded = expandedNodes.has(node.id);
        const children = isExpanded ? node.children || [] : [];
        
        const positionedNode: PositionedMindMapNode = {
            ...node,
            x: 0,
            y: depth * (NODE_HEIGHT + VERTICAL_SPACING),
            modifier: 0,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            children: [], // Start with empty children array
        };

        if (children.length === 0) {
            // Leaf node
            if (parent) {
                const previousSibling = parent.children[parent.children.length - 1];
                positionedNode.x = previousSibling ? previousSibling.x + NODE_WIDTH + HORIZONTAL_SPACING : 0;
            } else {
                 positionedNode.x = 0;
            }
        } else {
            // Branch node
            children.forEach(child => {
                 const positionedChild = firstPass(child, depth + 1, positionedNode);
                 positionedNode.children.push(positionedChild);
            });
            
            const firstChild = positionedNode.children[0];
            const lastChild = positionedNode.children[positionedNode.children.length - 1];
            const childrenWidth = lastChild.x + NODE_WIDTH - firstChild.x;
            positionedNode.x = firstChild.x + childrenWidth / 2 - NODE_WIDTH / 2;
        }

        if (parent) {
             const previousSibling = parent.children[parent.children.length - 1];
             if(previousSibling) {
                 // Adjust for spacing
                 positionedNode.x = Math.max(positionedNode.x, previousSibling.x + NODE_WIDTH + HORIZONTAL_SPACING);
                 positionedNode.modifier = positionedNode.x - previousSibling.x;
             }
        }
       
        return positionedNode;
    }
    
    function secondPass(node: PositionedMindMapNode, mod: number) {
        node.x += mod;
        
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x + NODE_WIDTH);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y + NODE_HEIGHT);

        positionedNodes.push(node);
        
        node.children.forEach(child => {
            // FIX: Removed unnecessary type casting as `child` is now correctly typed.
            secondPass(child, mod + node.modifier);

            // Create connector
            connectors.push({
                source: { id: node.id, x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 },
                // FIX: Removed unnecessary type casting as `child` is now correctly typed.
                target: { id: child.id, x: child.x, y: child.y + NODE_HEIGHT / 2 },
            });
        });
    }

    if (root) {
        const positionedRoot = firstPass(root, 0);
        secondPass(positionedRoot, 0);
    }
    
    // Normalize coordinates to be >= 0
    positionedNodes.forEach(node => {
        node.x -= minX;
        node.y -= minY;
    });

    connectors.forEach(connector => {
        connector.source.x -= minX;
        connector.source.y -= minY;
        connector.target.x -= minX;
        connector.target.y -= minY;
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    return { positionedNodes, connectors, contentWidth, contentHeight };
};
