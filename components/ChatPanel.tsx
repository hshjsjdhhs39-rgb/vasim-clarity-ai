import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { ChatIcon } from './icons/InputIcons';

interface ChatPanelProps {
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ chatHistory, onSendMessage, isLoading }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && !isLoading) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700 flex-1 flex flex-col min-h-0">
            <h2 className="text-xl font-bold text-white p-4 border-b border-gray-700 flex items-center">
                <ChatIcon className="w-6 h-6 mr-2 text-indigo-400" />
                Chat with AI
            </h2>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0"></div>}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                            msg.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-gray-700 text-gray-200 rounded-bl-none'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && chatHistory[chatHistory.length - 1]?.sender === 'user' && (
                     <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0"></div>
                        <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-700 text-gray-200 rounded-bl-none">
                            <p className="text-sm animate-pulse">Thinking...</p>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask a question about the mind map..."
                        disabled={isLoading}
                        className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;