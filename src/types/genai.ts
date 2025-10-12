export type GenerationStatus = 'idle' | 'initializing' | 'generating' | 'animating' | 'error';

export type GeneratedAsset = {
  id: string;
  type: 'image' | 'video';
  url: string;
  mimeType: string;
  createdAt: number;
  prompt: string;
};

export type GenAIRequest = {
  prompt: string;
  sketch: Blob;
  size?: number;
};

export type GenAIClient = {
  generateImage: (payload: GenAIRequest) => Promise<GeneratedAsset>;
  generateVideo: (image: GeneratedAsset) => Promise<GeneratedAsset>;
  isStub: boolean;
};
