import React, { useState, useCallback } from 'react';
import { TextIcon, FileIcon, LinkIcon } from './icons/InputIcons';

// توسيع واجهة Window لجعل TypeScript على دراية بالمكتبات التي تم تحميلها من CDN.
declare global {
    interface Window {
        pdfjsLib: any;
        mammoth: any;
        html2canvas: any;
        jspdf: any;
    }
}

// دالة مساعدة لانتظار تحميل مكتبة عامة من CDN
// تمت إضافة فاصلة زائدة داخل معامل النوع العام للتمييز بينه وبين وسم JSX.
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

interface InputAreaProps {
    onGenerate: (text: string) => void;
    isLoading: boolean;
}

type InputMode = 'text' | 'file' | 'url';

const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isLoading }) => {
    const [mode, setMode] = useState<InputMode>('text');
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setText('');
        setFileName(file.name);
        setIsProcessingFile(true);

        try {
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setText(e.target?.result as string);
                    setIsProcessingFile(false);
                };
                reader.readAsText(file);
            } else if (file.type === 'application/pdf') {
                try {
                    const pdfjsLib = await waitForLibrary<any>('pdfjsLib');
                    // استخدام نفس CDN للعامل (worker) لضمان الموثوقية وتوافق الإصدارات
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@2.11.338/build/pdf.worker.min.js`;
                    
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const data = new Uint8Array(e.target?.result as ArrayBuffer);
                            const pdf = await pdfjsLib.getDocument(data).promise;
                            let fullText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                                fullText += pageText + '\n';
                            }
                            setText(fullText);
                        } catch (pdfError) {
                            console.error('Error processing PDF:', pdfError);
                            alert('Failed to process the PDF file. It might be corrupted or in an unsupported format.');
                            setFileName('');
                        } finally {
                            setIsProcessingFile(false);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } catch (libError) {
                    console.error('Library loading error:', libError);
                    alert((libError as Error).message);
                    setIsProcessingFile(false);
                    setFileName('');
                }
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                 try {
                    const mammoth = await waitForLibrary<any>('mammoth');
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const arrayBuffer = e.target?.result as ArrayBuffer;
                            const result = await mammoth.extractRawText({ arrayBuffer });
                            setText(result.value);
                        } catch (docxError) {
                            console.error('Error processing DOCX:', docxError);
                            alert('Failed to process the DOCX file.');
                            setFileName('');
                        } finally {
                            setIsProcessingFile(false);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } catch (libError) {
                    console.error('Library loading error:', libError);
                    alert((libError as Error).message);
                    setIsProcessingFile(false);
                    setFileName('');
                }
            } else {
                alert(`Unsupported file type: ${file.type || 'unknown'}. Please upload a .txt, .pdf, or .docx file.`);
                setFileName('');
                setIsProcessingFile(false);
            }
        } catch (error) {
            console.error("File handling error:", error);
            alert("An unexpected error occurred while handling the file.");
            setIsProcessingFile(false);
            setFileName('');
        }
        
        // إعادة تعيين قيمة إدخال الملف للسماح بإعادة تحميل نفس الملف
        event.target.value = '';
    }, []);

    const handleSubmit = useCallback(async () => {
        if (mode === 'url') {
            onGenerate(url);
        } else {
            onGenerate(text);
        }
    }, [onGenerate, text, mode, url]);

    const renderInput = () => {
        switch (mode) {
            case 'text':
                return (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste an article, your notes, or any raw text here..."
                        className="w-full h-48 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                );
            case 'file':
                return (
                    <div className="flex flex-col items-center justify-center w-full h-48 bg-gray-900 border-2 border-dashed border-gray-600 rounded-md p-4">
                        <FileIcon className="w-10 h-10 text-gray-500 mb-2" />
                        <label htmlFor="file-upload" className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-semibold">
                            Choose a .txt, .pdf, or .docx file
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
                        {fileName && <p className="text-sm text-gray-400 mt-2 truncate" title={fileName}>{fileName}</p>}
                    </div>
                );
            case 'url':
                return (
                     <div className="w-full h-48 flex flex-col justify-center">
                        <label htmlFor="url-input" className="text-sm font-medium text-gray-300 mb-2">YouTube or Web Page URL</label>
                        <input
                            id="url-input"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=... or https://example.com/article"
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-100"
                         />
                         <p className="text-xs text-gray-500 mt-2">
                            The AI will analyze the video transcript or article content.
                        </p>
                    </div>
                );
        }
    };
    
    const TabButton = ({ activeMode, targetMode, icon, label }: { activeMode: InputMode, targetMode: InputMode, icon: JSX.Element, label: string }) => (
        <button
            onClick={() => setMode(targetMode)}
            className={`flex-1 flex items-center justify-center p-2 text-sm font-medium rounded-t-md transition-colors ${
                activeMode === targetMode
                    ? 'bg-gray-900 text-indigo-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="ml-2">{label}</span>
        </button>
    );
    
    const isBusy = isLoading || isProcessingFile;
    const isButtonDisabled = isBusy || (mode === 'url' ? !url.trim() : !text.trim());
    
    const getButtonText = () => {
        if (isLoading) return 'Analyzing...';
        if (isProcessingFile) return 'Processing File...';
        return 'Generate Mind Map';
    };

    return (
        <div className="flex flex-col">
            <div className="flex">
                <TabButton activeMode={mode} targetMode="text" icon={<TextIcon className="w-5 h-5" />} label="Text" />
                <TabButton activeMode={mode} targetMode="file" icon={<FileIcon className="w-5 h-5" />} label="File" />
                <TabButton activeMode={mode} targetMode="url" icon={<LinkIcon className="w-5 h-5" />} label="URL" />
            </div>

            <div className="p-4 bg-gray-900 rounded-b-md">
                {renderInput()}
            </div>

            <button
                onClick={handleSubmit}
                disabled={isButtonDisabled}
                className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
            >
                {isBusy ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {getButtonText()}
                    </>
                ) : (
                    'Generate Mind Map'
                )}
            </button>
        </div>
    );
};

export default InputArea;