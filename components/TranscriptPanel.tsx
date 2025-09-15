import React, { useState } from 'react';
import { TranscriptIcon } from './icons/InputIcons';

interface TranscriptPanelProps {
    transcript: string;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ transcript }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy');

    const handleCopy = () => {
        navigator.clipboard.writeText(transcript).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy'), 2000);
        }).catch(err => {
            console.error('Failed to copy transcript: ', err);
            setCopyButtonText('Failed!');
             setTimeout(() => setCopyButtonText('Copy'), 2000);
        });
    };

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center">
                    <TranscriptIcon className="w-6 h-6 mr-2 text-indigo-400" />
                    Video Transcript
                </h2>
                <button
                    onClick={handleCopy}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                >
                    {copyButtonText}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {transcript}
                </p>
            </div>
        </div>
    );
};

export default TranscriptPanel;