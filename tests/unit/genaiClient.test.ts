import { describe, expect, it, beforeEach } from 'vitest';
import { createGenAIClient } from '../../src/services/genaiClient';

describe('createGenAIClient', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).GOOGLE_API_KEY = '';
  });

  it('falls back to stub client when no API key is present', async () => {
    const client = createGenAIClient();
    expect(client.isStub).toBe(true);
    const asset = await client.generateImage({ prompt: 'test', sketch: new Blob(['stub'], { type: 'image/png' }) });
    expect(asset.type).toBe('image');
    expect(asset.url).toBeTypeOf('string');
  });
});
