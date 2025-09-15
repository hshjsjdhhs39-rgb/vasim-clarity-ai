import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect, useMemo, useCallback } from 'react';
import type { MindMapNode, CustomizationSettings } from '../types';
import MindMapNodeComponent from './MindMapNodeComponent';
import { calculateLayout, PositionedMindMapNode } from '../utils/layout';
import { getConnectorPath } from '../utils/styling';

export interface MindMapHandle {
    getContainer: () => HTMLDivElement | null;
    getDimensions: () => { width: number; height: number };
}

interface MindMapProps {
    data: MindMapNode;
    onNodeSelect: (node: MindMapNode) => void;
    selectedNodeId?: string | null;
    isLoading: boolean;
    customization: CustomizationSettings;
}

const MindMap = forwardRef<MindMapHandle, MindMapProps>(({ data, onNodeSelect, selectedNodeId, isLoading, customization }, ref) => {
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.7 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const prevIsLoading = useRef(isLoading);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // توسيع جميع العقد عند تحميل بيانات جديدة
    useEffect(() => {
        if (data) {
            const allIds = new Set<string>();
            const traverse = (node: MindMapNode) => {
                allIds.add(node.id);
                if (node.children) {
                    node.children.forEach(traverse);
                }
            };
            traverse(data);
            setExpandedNodes(allIds);
        }
    }, [data]);

    const toggleNodeExpansion = useCallback((nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    // FIX: Moved the layout calculation before `useImperativeHandle` to ensure `contentWidth` and `contentHeight` are declared before use.
    const { positionedNodes, connectors, contentWidth, contentHeight } = useMemo(() => {
        if (!data) return { positionedNodes: [], connectors: [], contentWidth: 0, contentHeight: 0 };
        return calculateLayout(data, expandedNodes);
    }, [data, expandedNodes]);

    // Expose methods and properties to the parent component via the ref
    useImperativeHandle(ref, () => ({
        getContainer: () => containerRef.current,
        getDimensions: () => ({ width: contentWidth, height: contentHeight }),
    }), [contentWidth, contentHeight]);

    const fitView = useCallback(() => {
        const container = containerRef.current;
        if (!container || contentWidth === 0 || contentHeight === 0) return;

        const containerBounds = container.getBoundingClientRect();
        const padding = 80;

        const scaleX = (containerBounds.width - padding) / contentWidth;
        const scaleY = (containerBounds.height - padding) / contentHeight;
        const newScale = Math.min(scaleX, scaleY, 1.5);

        const newX = (containerBounds.width - contentWidth * newScale) / 2;
        const newY = (containerBounds.height - contentHeight * newScale) / 2;

        setTransform({ x: newX, y: newY, scale: newScale });
    }, [contentWidth, contentHeight]);

    useEffect(() => {
        if (prevIsLoading.current && !isLoading) {
            setTimeout(fitView, 100);
        }
        prevIsLoading.current = isLoading;
    }, [isLoading, fitView]);
    
    // إعادة ملائمة العرض عند تغيير حجم النافذة أو التخطيط
    useEffect(() => {
      const observer = new ResizeObserver(fitView);
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
    }, [fitView]);


    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.2, transform.scale + scaleAmount), 2);
        
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = transform.x + (mouseX - transform.x) * (1 - newScale / transform.scale);
        const newY = transform.y + (mouseY - transform.y) * (1 - newScale / transform.scale);
        
        setTransform({ x: newX, y: newY, scale: newScale });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('.node-card')) return;
        setIsPanning(true);
        setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning) return;
        setTransform(prev => ({ ...prev, x: e.clientX - startPan.x, y: e.clientY - startPan.y }));
    };

    const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsPanning(false);
        e.currentTarget.style.cursor = 'grab';
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full bg-gray-900 overflow-hidden relative select-none cursor-grab"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
        >
            <div
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: 'top left',
                    transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                <svg 
                    className="absolute top-0 left-0 overflow-visible pointer-events-none"
                    style={{ width: contentWidth, height: contentHeight }}
                >
                    <g>
                        {connectors.map(({ source, target }) => (
                           <path
                                key={`${source.id}-${target.id}`}
                                d={getConnectorPath(
                                    { x: source.x, y: source.y },
                                    { x: target.x, y: target.y },
                                    customization.connectorStyle
                                )}
                                className="stroke-gray-600 stroke-2"
                                fill="none"
                            />
                        ))}
                    </g>
                </svg>

                {positionedNodes.map(node => (
                     <div
                        key={node.id}
                        className="absolute transition-all duration-300 ease-in-out"
                        style={{ top: node.y, left: node.x }}
                     >
                        <MindMapNodeComponent
                            node={node}
                            onNodeSelect={onNodeSelect}
                            selectedNodeId={selectedNodeId}
                            customization={customization}
                            isExpanded={expandedNodes.has(node.id)}
                            onToggleExpand={() => toggleNodeExpansion(node.id)}
                        />
                     </div>
                ))}
            </div>
            <button
              onClick={fitView}
              className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-2 rounded-lg shadow-lg transition-transform transform hover:scale-105 text-xs"
              title="Reset View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
              </svg>
            </button>
        </div>
    );
});

MindMap.displayName = "MindMap";

export default MindMap;