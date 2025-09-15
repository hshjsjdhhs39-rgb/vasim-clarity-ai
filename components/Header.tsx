import React from 'react';
import { CustomizeIcon } from './icons/InputIcons';

interface HeaderProps {
    onCustomizeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCustomizeClick }) => {
    return (
        <header className="bg-gray-800/70 backdrop-blur-sm border-b border-gray-700 p-4 shadow-md flex items-center justify-between z-10">
            <div>
                <h1 className="text-2xl font-bold text-white">
                    <span className="text-indigo-400">Vasim</span> Clarity AI
                </h1>
                <p className="text-sm text-gray-400">Transforming Data into Visual Insight</p>
            </div>
            <button
                onClick={onCustomizeClick}
                className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                title="Customize View"
            >
                <CustomizeIcon className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Customize</span>
            </button>
        </header>
    );
};

export default Header;