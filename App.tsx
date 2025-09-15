import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { MindMapNode, CustomizationSettings, ChatMessage, StreamedData } from './types';
import { generateMindMapDataStream, chatWithMindMap } from './services/geminiService';
import Header from './components/Header';
import InputArea from './components/InputArea';
import MindMap, { type MindMapHandle } from './components/MindMap';
import NodeDetailPanel from './components/NodeDetailPanel';
import Loader from './components/Loader';
import CustomizePanel from './components/CustomizePanel';
import ChatPanel from './components/ChatPanel';
import TranscriptPanel from './components/TranscriptPanel';
import { ChatIcon, TextIcon, TranscriptIcon } from './components/icons/InputIcons';

// دالة مساعدة لانتظار تحميل مكتبة عامة من CDN
const waitForLibrary = <T,>(libraryName: string, timeout = 5000): Promise<T> => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = 100; // Check every 100ms
        const maxAttempts = timeout / interval;

        const check = () => {
            if ((window as any)[libraryName]) {
                resolve((window as any)[libraryName] as T);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, interval);
            } else {
                reject(new Error(`Library '${libraryName}' failed to load within ${timeout/1000} seconds. Please check your network connection and refresh the page.`));
            }
        };
        check();
    });
};

const App: React.FC = () => {
    const [nodes, setNodes] = useState<MindMapNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const mindMapContainerRef = useRef<MindMapHandle>(null);
    const [isCustomizePanelOpen, setIsCustomizePanelOpen] = useState(false);
    const [customization, setCustomization] = useState<CustomizationSettings>({
        nodeShape: 'rounded',
        colorPalette: 'default',
        connectorStyle: 'elbow',
    });
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [sidebarTab, setSidebarTab] = useState<'generator' | 'chat' | 'transcript'>('generator');
    const [videoTranscript, setVideoTranscript] = useState<string | null>(null);


    const mindMapData = useMemo<MindMapNode | null>(() => {
        if (nodes.length === 0) return null;

        const nodeMap = new Map<string, MindMapNode>();
        const rootNodes: MindMapNode[] = [];

        // المرور الأول: إنشاء خريطة لجميع العقد وتهيئة مصفوفات الأبناء
        nodes.forEach(node => {
            nodeMap.set(node.id, { ...node, children: [] });
        });

        // المرور الثاني: ربط العقد الأبناء بآبائهم
        nodeMap.forEach(node => {
            if (node.parentId && nodeMap.has(node.parentId)) {
                nodeMap.get(node.parentId)!.children.push(node);
            } else if (node.parentId === null) {
                rootNodes.push(node);
            }
        });

        // نفترض وجود عقدة جذر واحدة فقط لخريطة ذهنية صالحة
        return rootNodes.length > 0 ? nodeMap.get(rootNodes[0].id) ?? null : null;
    }, [nodes]);

    const mindMapJsonString = useMemo(() => {
        return mindMapData ? JSON.stringify(mindMapData, null, 2) : '';
    }, [mindMapData]);


    const handleGenerateMindMap = useCallback(async (inputText: string) => {
        if (!inputText.trim()) {
            setError("Input text cannot be empty.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setNodes([]);
        setSelectedNode(null);
        setChatHistory([]);
        setVideoTranscript(null); // إعادة تعيين النص عند كل عملية توليد جديدة
        setSidebarTab('generator');

        try {
            const stream = generateMindMapDataStream(inputText);
            for await (const data of stream) {
                if (data.type === 'transcript') {
                    setVideoTranscript(data.content);
                    // Automatically switch to the transcript tab when it's received
                    setSidebarTab('transcript');
                } else if (data.type === 'node') {
                    setNodes(prevNodes => [...prevNodes, data]);
                    // تحديد أحدث عقدة عند ظهورها
                    setSelectedNode(data);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSendChatMessage = useCallback(async (message: string) => {
        const userMessage: ChatMessage = { sender: 'user', text: message };
        setChatHistory(prev => [...prev, userMessage]);
        setIsChatLoading(true);

        try {
            const aiResponseText = await chatWithMindMap(message, mindMapJsonString);
            const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
            setChatHistory(prev => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage: ChatMessage = { sender: 'ai', text: err instanceof Error ? err.message : "Sorry, I couldn't process that." };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    }, [mindMapJsonString]);

    const handleNodeSelect = useCallback((node: MindMapNode) => {
        // البحث عن العقدة الكاملة من القائمة المسطحة لضمان وجود المرجع الصحيح للكائن
        const fullNode = nodes.find(n => n.id === node.id);
        if (fullNode) {
          setSelectedNode(fullNode);
          setSidebarTab('generator'); // Switch to generator tab to show details
        }
    }, [nodes]);

    const handleExport = useCallback(async () => {
        if (!mindMapContainerRef.current) {
            alert("Mind map is not ready for export.");
            return;
        }
    
        const container = mindMapContainerRef.current.getContainer();
        const { width: contentWidth, height: contentHeight } = mindMapContainerRef.current.getDimensions();
    
        if (!container || contentWidth <= 0 || contentHeight <= 0) {
            alert("Mind map content not found or has no dimensions.");
            return;
        }
    
        const contentWrapper = container.querySelector('div');
        if (!contentWrapper) {
            alert("Mind map content wrapper not found for export.");
            return;
        }
    
        const originalTransform = contentWrapper.style.transform;
    
        try {
            const [html2canvas, { jsPDF }] = await Promise.all([
                waitForLibrary<any>('html2canvas'),
                waitForLibrary<any>('jspdf')
            ]);
    
            // 1. Reset transform for a clean capture at original size and position
            contentWrapper.style.transform = '';
    
            const canvas = await html2canvas(contentWrapper, {
                backgroundColor: '#111827', // bg-gray-900
                useCORS: true,
                scale: 3, // Increase scale for higher resolution PDF
                // 2. Provide explicit dimensions for full capture
                width: contentWidth,
                height: contentHeight,
                x: 0,
                y: 0,
            });
    
            const imgData = canvas.toDataURL('image/png');
            if (imgData === 'data:,') {
                 throw new Error('Canvas returned an empty or corrupt image.');
            }
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
    
            const orientation = imgWidth > imgHeight ? 'l' : 'p';
            const pdf = new jsPDF(orientation, 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
    
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const finalImgWidth = imgWidth * ratio;
            const finalImgHeight = imgHeight * ratio;
            
            const xOffset = (pdfWidth - finalImgWidth) / 2;
            const yOffset = (pdfHeight - finalImgHeight) / 2;
    
            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
            pdf.save('vasim-clarity-ai-map.pdf');
    
        } catch (error) {
            console.error("Export failed:", error);
            alert(`Could not export the mind map as PDF. Error: ${error instanceof Error ? error.message : 'Incomplete or corrupt PNG file'}`);
        } finally {
            // 3. Restore the original transform to not disrupt the user's view
            contentWrapper.style.transform = originalTransform;
        }
    }, []);

    return (
        <div className="flex flex-col h-screen font-sans bg-gray-900 text-gray-100 overflow-hidden">
            <Header onCustomizeClick={() => setIsCustomizePanelOpen(!isCustomizePanelOpen)} />
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full lg:w-1/4 xl:w-1/5 p-4 bg-gray-800/50 border-r border-gray-700 flex flex-col relative">
                    {isCustomizePanelOpen && (
                        <CustomizePanel
                            settings={customization}
                            onSettingsChange={setCustomization}
                            onClose={() => setIsCustomizePanelOpen(false)}
                        />
                    )}
                    <div className={`flex flex-col flex-1 min-h-0 ${isCustomizePanelOpen ? 'opacity-10 pointer-events-none' : 'transition-opacity'}`}>
                        {/* نظام التبويبات الرئيسي الجديد */}
                        <div className="flex border-b border-gray-700 flex-shrink-0">
                            <button
                                onClick={() => setSidebarTab('generator')}
                                className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm font-medium transition-colors ${sidebarTab === 'generator' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                            >
                                <TextIcon className="w-5 h-5" /> Generator
                            </button>
                             {videoTranscript && (
                                <button
                                    onClick={() => setSidebarTab('transcript')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm font-medium transition-colors ${sidebarTab === 'transcript' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                                >
                                    <TranscriptIcon className="w-5 h-5" /> Transcript
                                </button>
                            )}
                            <button
                                onClick={() => setSidebarTab('chat')}
                                disabled={!mindMapData}
                                className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm font-medium transition-colors ${sidebarTab === 'chat' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-700/50'} disabled:text-gray-600 disabled:cursor-not-allowed`}
                            >
                                <ChatIcon className="w-5 h-5" /> Chat
                            </button>
                        </div>

                        {/* المحتوى الشرطي بناءً على التبويب النشط */}
                        {sidebarTab === 'generator' && (
                            <div className="pt-4 grid grid-rows-[auto_1fr] gap-4 flex-1 min-h-0">
                                <InputArea onGenerate={handleGenerateMindMap} isLoading={isLoading} />
                                <div className="min-h-0 flex flex-col">
                                    {selectedNode ? (
                                        <NodeDetailPanel node={selectedNode} />
                                    ) : !isLoading && !mindMapData ? (
                                        <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-400 p-4">
                                            <div className="w-16 h-16 mb-4 text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-1.5m-6 0h1.5m-1.5 0h-1.5m0 0h-1.5m0 0H6m6 0h6m-6 0H6m6 0h6m0 0v3.75a2.25 2.25 0 0 1-2.25-2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V16.5" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-300">Welcome to Vasim Clarity AI</h3>
                                            <p className="mt-1 text-sm">Enter some text or upload a file to start generating your interactive mind map.</p>
                                            <p className="mt-6 text-xs text-white font-bold">
                                                Developed by Eng. Vasim Omar
                                                <br />
                                                Software & AI Engineer
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                        
                        {sidebarTab === 'chat' && (
                             <div className="pt-4 flex-1 flex flex-col min-h-0">
                                {mindMapData ? (
                                    <ChatPanel
                                        chatHistory={chatHistory}
                                        onSendMessage={handleSendChatMessage}
                                        isLoading={isChatLoading}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col justify-center items-center text-center text-gray-400 p-4">
                                        <ChatIcon className="w-16 h-16 mb-4 text-gray-500" />
                                        <h3 className="text-lg font-semibold text-gray-300">Generate a Map to Chat</h3>
                                        <p className="mt-1 text-sm">Once a mind map is created, you can ask the AI questions about it here.</p>
                                    </div>
                                )}
                             </div>
                        )}

                        {sidebarTab === 'transcript' && videoTranscript && (
                            <div className="pt-4 flex-1 flex flex-col min-h-0">
                                <TranscriptPanel transcript={videoTranscript} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-900">
                    {isLoading && nodes.length === 0 && <Loader />}
                    {error && (
                        <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                    {!error && mindMapData && (
                        <>
                            <MindMap
                                ref={mindMapContainerRef}
                                data={mindMapData}
                                onNodeSelect={handleNodeSelect}
                                selectedNodeId={selectedNode?.id}
                                isLoading={isLoading}
                                customization={customization}
                            />
                            <button
                                onClick={handleExport}
                                className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                            >
                                Export as PDF
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;