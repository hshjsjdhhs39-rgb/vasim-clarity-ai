import React from 'react';
import type { CustomizationSettings, NodeShape, ColorPalette, ConnectorStyle } from '../types';

interface CustomizePanelProps {
    settings: CustomizationSettings;
    onSettingsChange: (newSettings: CustomizationSettings) => void;
    onClose: () => void;
}

const CustomizePanel: React.FC<CustomizePanelProps> = ({ settings, onSettingsChange, onClose }) => {
    
    const handleSettingChange = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    // FIX: Made OptionButton a generic component to preserve the type relationship between settingKey and value.
    // This resolves the error: "Argument of type 'string' is not assignable to parameter of type 'NodeShape | ColorPalette | ConnectorStyle'".
    function OptionButton<K extends keyof CustomizationSettings>({
        label,
        value,
        settingKey,
        currentValue,
    }: {
        label: string;
        value: CustomizationSettings[K];
        settingKey: K;
        currentValue: CustomizationSettings[K];
    }) {
        return (
            <button
                onClick={() => handleSettingChange(settingKey, value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    currentValue === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                }`}
            >
                {label}
            </button>
        );
    }

    return (
        <div className="absolute inset-0 bg-gray-800/95 backdrop-blur-sm z-20 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Customize View</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-6">
                {/* Node Shape */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Node Shape</label>
                    <div className="flex space-x-2">
                        <OptionButton label="Rounded" value="rounded" settingKey="nodeShape" currentValue={settings.nodeShape} />
                        <OptionButton label="Rectangle" value="rectangle" settingKey="nodeShape" currentValue={settings.nodeShape} />
                        <OptionButton label="Oval" value="oval" settingKey="nodeShape" currentValue={settings.nodeShape} />
                    </div>
                </div>

                {/* Color Palette */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Color Palette</label>
                    <div className="flex space-x-2">
                       <OptionButton label="Default" value="default" settingKey="colorPalette" currentValue={settings.colorPalette} />
                       <OptionButton label="Forest" value="forest" settingKey="colorPalette" currentValue={settings.colorPalette} />
                       <OptionButton label="Ocean" value="ocean" settingKey="colorPalette" currentValue={settings.colorPalette} />
                       <OptionButton label="Sunset" value="sunset" settingKey="colorPalette" currentValue={settings.colorPalette} />
                    </div>
                </div>

                {/* Connector Style */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Connector Style</label>
                    <div className="flex space-x-2">
                       <OptionButton label="Elbow" value="elbow" settingKey="connectorStyle" currentValue={settings.connectorStyle} />
                       <OptionButton label="Curved" value="curved" settingKey="connectorStyle" currentValue={settings.connectorStyle} />
                       <OptionButton label="Straight" value="straight" settingKey="connectorStyle" currentValue={settings.connectorStyle} />
                    </div>
                </div>
            </div>
             <button onClick={onClose} className="mt-auto w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                Close
            </button>
        </div>
    );
};

export default CustomizePanel;
