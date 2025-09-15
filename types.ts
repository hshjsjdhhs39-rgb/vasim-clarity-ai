export enum NodeType {
    TOPIC = "Topic",
    SUB_TOPIC = "Sub-Topic",
    DETAIL = "Detail",
    FACT = "Fact",
    QUOTE = "Quote",
    INSIGHT = "Insight",
    QUESTION = "Question"
}

export interface MindMapNode {
    type: 'node'; // حقل للتمييز بين أنواع البيانات في البث
    id: string;
    parentId: string | null;
    title: string;
    summary: string;
    keyPoints: string[];
    confidenceScore: number;
    nodeType: NodeType;
    children: MindMapNode[];
}

export interface TranscriptData {
    type: 'transcript';
    content: string;
}

// نوع موحد لجميع البيانات التي يمكن أن تأتي من البث
export type StreamedData = MindMapNode | TranscriptData;

// أنواع التخصيص الجديدة
export type NodeShape = 'rounded' | 'rectangle' | 'oval';
export type ColorPalette = 'default' | 'forest' | 'ocean' | 'sunset';
export type ConnectorStyle = 'elbow' | 'curved' | 'straight';

export interface CustomizationSettings {
    nodeShape: NodeShape;
    colorPalette: ColorPalette;
    connectorStyle: ConnectorStyle;
}

// واجهة لرسائل الدردشة
export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}