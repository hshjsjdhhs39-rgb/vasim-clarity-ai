import { GoogleGenAI } from "@google/genai";
import { MindMapNode, NodeType, StreamedData, TranscriptData } from '../types';

// Lazily initialize the AI instance to avoid crashing the app on load
// if the API key is not set.
let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
    if (!ai) {
        // Per instructions, we must assume 'process.env.API_KEY' is available
        // in the execution environment and not perform a check that would throw an error.
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

// دالة لمعالجة وتنظيف كائن العقدة المستلم لضمان سلامة البيانات
const sanitizeNode = (parsedJson: any): MindMapNode | null => {
    // العقدة غير صالحة إذا كانت تفتقر إلى المعرف أو العنوان الأساسيين
    if (!parsedJson || typeof parsedJson.id !== 'string' || typeof parsedJson.title !== 'string') {
        console.warn("Skipping invalid node data:", parsedJson);
        return null;
    }
    return {
        type: 'node',
        id: parsedJson.id,
        parentId: parsedJson.parentId !== undefined ? parsedJson.parentId : null,
        title: parsedJson.title,
        summary: parsedJson.summary || '',
        keyPoints: Array.isArray(parsedJson.keyPoints) ? parsedJson.keyPoints : [],
        // التأكد من أن confidenceScore هو رقم صالح بين 0 و 1 لتجنب أخطاء NaN
        confidenceScore: (typeof parsedJson.confidenceScore === 'number' && !isNaN(parsedJson.confidenceScore)) 
            ? Math.max(0, Math.min(1, parsedJson.confidenceScore)) 
            : 0.8,
        nodeType: Object.values(NodeType).includes(parsedJson.nodeType) ? parsedJson.nodeType : NodeType.DETAIL,
        children: [], // يتم إعادة بناء الأبناء لاحقًا في App.tsx
    };
};

const sanitizeTranscript = (parsedJson: any): TranscriptData | null => {
    if (!parsedJson || typeof parsedJson.content !== 'string') {
        console.warn("Skipping invalid transcript data:", parsedJson);
        return null;
    }
    return {
        type: 'transcript',
        content: parsedJson.content,
    };
};

export async function* generateMindMapDataStream(text: string): AsyncGenerator<StreamedData> {
    const prompt = `
        **Your Task: Deep Analysis, Transcript Extraction & Hierarchical Mind Map Generation**

        You are an expert AI analyst. Your primary task is to analyze the provided input. 

        **Critical Initial Step: Input Detection**
        First, intelligently determine the type of input.
        - **If the input is a YouTube URL:** Your FIRST action MUST be to fetch the video's full transcript.
        - **If the input is a web article URL:** Extract the main content, ignoring irrelevant elements like menus, ads, and footers.
        - **If the input is plain text:** Use the text directly.

        **Output Requirements:**

        1.  **YouTube Transcript Output (if applicable):**
            *   If the input was a YouTube URL, the VERY FIRST object you output MUST be a single JSON object for the transcript.
            *   **Schema:** \`{"type": "transcript", "content": "The full extracted text of the video..."}\`
            *   After outputting the transcript object, proceed to generate the mind map nodes based on that transcript.

        2.  **Mind Map Node Output:**
            *   You MUST output a stream of individual, newline-delimited JSON objects for the mind map. Each object represents one node.
            *   DO NOT wrap the objects in a JSON array. Use double quotes for all keys and string values.
            *   The VERY FIRST node you output must be the main root topic, and its 'parentId' MUST be 'null'.
            *   Every subsequent node MUST have a 'parentId' that corresponds to the 'id' of a previously generated node.
            *   Generate a RICH and LARGE number of nodes (15-30+ for substantial texts) with a DEEP hierarchy.
            *   **Node JSON Schema:**
                *   \`"type"\`: MUST be the string \`"node"\`.
                *   \`"id"\`: A unique string identifier.
                *   \`"parentId"\`: The ID of the parent node ('null' for the root).
                *   \`"title"\`: A concise title.
                *   \`"summary"\`: A short summary.
                *   \`"keyPoints"\`: An array of key bullet points.
                *   \`"confidenceScore"\`: A number from 0.0 to 1.0.
                *   \`"nodeType"\`: One of: "Topic", "Sub-Topic", "Detail", "Fact", "Quote", "Insight", "Question".
    `;

    try {
        const geminiAI = getAiInstance();
        const responseStream = await geminiAI.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt + `\n\n**Input Text:**\n---\n${text}\n---`,
        });
        
        let buffer = '';
        for await (const chunk of responseStream) {
            buffer += chunk.text;
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                let line = buffer.substring(0, newlineIndex).trim();
                buffer = buffer.substring(newlineIndex + 1);

                line = line.replace(/^```json/, '').replace(/```$/, '').trim();
                line = line.replace(/,$/, ''); 

                if (!line || line === '[' || line === ']') {
                    continue;
                }

                if (line.startsWith('{') && line.endsWith('}')) {
                    try {
                        const parsedJson = JSON.parse(line);
                        if (parsedJson.type === 'transcript') {
                            const sanitized = sanitizeTranscript(parsedJson);
                            if (sanitized) yield sanitized;
                        } else if (parsedJson.type === 'node') {
                            const sanitized = sanitizeNode(parsedJson);
                            if (sanitized) yield sanitized;
                        }
                    } catch (e) {
                        console.warn("Could not parse cleaned streamed JSON line:", line, e);
                    }
                }
            }
        }

        if (buffer.trim()) {
             let finalLine = buffer.trim().replace(/^```json/, '').replace(/```$/, '').trim().replace(/,$/, '');
             if (finalLine.startsWith('{') && finalLine.endsWith('}')) {
                 try {
                    const parsedJson = JSON.parse(finalLine);
                     if (parsedJson.type === 'transcript') {
                        const sanitized = sanitizeTranscript(parsedJson);
                        if (sanitized) yield sanitized;
                    } else if (parsedJson.type === 'node') {
                        const sanitized = sanitizeNode(parsedJson);
                        if (sanitized) yield sanitized;
                    }
                } catch (e) {
                    console.warn("Could not parse final cleaned streamed JSON buffer:", finalLine, e);
                }
             }
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error; // Propagate error to be handled by the UI
    }
};

export async function chatWithMindMap(question: string, mindMapJson: string): Promise<string> {
    const prompt = `
        **Role:** You are an expert analyst and you are interacting with a user about a mind map you have previously generated.
        **Context:** The user has generated a mind map, and you have access to its full structure as a JSON object.
        **Your Task:** Answer the user's question based EXCLUSIVELY on the information contained within the provided mind map JSON. Do not invent information or use external knowledge. If the answer cannot be found in the mind map, state that clearly.

        **Mind Map Data (JSON):**
        ---
        ${mindMapJson}
        ---

        **User's Question:**
        ---
        ${question}
        ---

        **Answer:**
    `;

    try {
        const geminiAI = getAiInstance();
        const response = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error in chatWithMindMap:", error);
        throw error; // Propagate error to be handled by the UI
    }
}