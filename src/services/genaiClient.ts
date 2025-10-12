import { nanoid } from 'nanoid/non-secure';
import type { GenAIClient, GenAIRequest, GeneratedAsset } from '../types/genai';

export const IMAGE_MODEL = 'gemini-2.5-flash-image';
export const VIDEO_MODEL = 'veo-2.0-generate-001';

const readApiKey = () => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  if (metaEnv?.VITE_GOOGLE_API_KEY) {
    return metaEnv.VITE_GOOGLE_API_KEY;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).GOOGLE_API_KEY) {
    return String((globalThis as Record<string, unknown>).GOOGLE_API_KEY);
  }
  return '';
};

const GOOGLE_API_KEY = readApiKey();

const base64FromBlob = async (blob: Blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const downloadUrlFromBlob = (blob: Blob) => URL.createObjectURL(blob);

const safePrompt = (prompt: string) => prompt.replace(/[<>]/g, '');

const createStubImage = async (prompt: string): Promise<GeneratedAsset> => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Stub Image', 32, 64);
  ctx.fillStyle = '#f97316';
  ctx.font = '16px sans-serif';
  ctx.fillText(prompt.slice(0, 60), 32, 110);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob fail'))), 'image/png')
  );
  return {
    id: nanoid(),
    type: 'image',
    url: downloadUrlFromBlob(blob),
    mimeType: 'image/png',
    createdAt: Date.now(),
    prompt
  };
};

const createStubVideo = async (prompt: string): Promise<GeneratedAsset> => {
  const blob = new Blob([`Stub video for ${prompt}`], { type: 'text/plain' });
  return {
    id: nanoid(),
    type: 'video',
    url: downloadUrlFromBlob(blob),
    mimeType: 'text/plain',
    createdAt: Date.now(),
    prompt
  };
};

const createStubClient = (): GenAIClient => ({
  isStub: true,
  generateImage: ({ prompt }: GenAIRequest) => createStubImage(prompt),
  generateVideo: (asset: GeneratedAsset) => createStubVideo(asset.prompt)
});

const fetchGenerative = async (model: string, body: unknown): Promise<Response> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
};

const createRealClient = (): GenAIClient => {
  return {
    isStub: false,
    async generateImage({ prompt, sketch, size = 1024 }: GenAIRequest) {
      const base64 = await base64FromBlob(sketch);
      const response = await fetchGenerative(IMAGE_MODEL, {
        contents: [
          {
            role: 'user',
            parts: [
              { text: safePrompt(prompt) },
              {
                inlineData: {
                  mimeType: sketch.type || 'image/png',
                  data: base64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          topP: 0.95,
          topK: 32,
          responseMimeType: 'image/png',
          responseSchema: {
            type: 'object',
            properties: {
              images: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'byte'
                }
              }
            }
          },
          // TODO: Replace when official SDK helper is updated.
          aspectRatio: `${size}:${size}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini image generation failed: ${errorText}`);
      }

      const json = await response.json();
      const imageBase64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!imageBase64) {
        throw new Error('Gemini response missing image data');
      }
      const byteCharacters = atob(imageBase64);
      const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, index) => byteCharacters.charCodeAt(index));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      return {
        id: nanoid(),
        type: 'image',
        url: downloadUrlFromBlob(blob),
        mimeType: 'image/png',
        createdAt: Date.now(),
        prompt
      } satisfies GeneratedAsset;
    },
    async generateVideo(image: GeneratedAsset) {
      const response = await fetchGenerative(VIDEO_MODEL, {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: image.mimeType,
                  data: await base64FromBlob(await fetch(image.url).then((res) => res.blob()))
                }
              },
              {
                text: `${safePrompt(image.prompt)}\nPlease animate this artwork with subtle 2-second motion.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'video/mp4',
          durationSeconds: 2,
          temperature: 0.2
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini video generation failed: ${errorText}`);
      }

      const json = await response.json();
      const videoBase64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!videoBase64) {
        throw new Error('Gemini response missing video data');
      }
      const byteCharacters = atob(videoBase64);
      const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, index) => byteCharacters.charCodeAt(index));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'video/mp4' });

      return {
        id: nanoid(),
        type: 'video',
        url: downloadUrlFromBlob(blob),
        mimeType: 'video/mp4',
        createdAt: Date.now(),
        prompt: image.prompt
      } satisfies GeneratedAsset;
    }
  } satisfies GenAIClient;
};

export const createGenAIClient = (): GenAIClient => {
  if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY missing, running in stub mode.');
    return createStubClient();
  }
  return createRealClient();
};
