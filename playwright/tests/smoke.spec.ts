import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Stub API key for stub client mode
    (window as unknown as Record<string, unknown>).GOOGLE_API_KEY = '';

    class MockWorker {
      public onmessage: ((event: MessageEvent) => void) | null = null;
      constructor() {
        (window as unknown as Record<string, unknown>).__handWorker = this;
        setTimeout(() => {
          this.onmessage?.({ data: { type: 'ready' } } as MessageEvent);
        }, 10);
      }
      postMessage(message: { type: string }) {
        if (message.type === 'frame') {
          const gesture = (window as unknown as Record<string, unknown>).__nextGesture || 'idle';
          const payload = {
            type: 'gesture',
            payload: {
              gesture: { type: gesture, confidence: 1 },
              landmarks: Array.from({ length: 21 }, () => ({ x: Math.random(), y: Math.random(), z: 0 }))
            }
          };
          setTimeout(() => this.onmessage?.({ data: payload } as MessageEvent), 5);
        }
      }
      terminate() {
        /* noop */
      }
    }
    // @ts-expect-error override Worker
    window.Worker = MockWorker;

    navigator.mediaDevices = {
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => undefined }]
      })
    } as unknown as MediaDevices;

    // @ts-expect-error createImageBitmap polyfill
    window.createImageBitmap = async () => ({ close: () => undefined });

    HTMLVideoElement.prototype.play = async () => undefined;
  });
});

test('user can draw and generate stub image', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('AI Gesture Canvas')).toBeVisible();

  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__nextGesture = 'point';
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__nextGesture = 'thumbs-up';
  });

  await page.getByLabel('Prompt text').fill('A playful robot in neon lights');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Generate Image' }).click();

  await expect(page.getByText('Image generated')).toBeVisible();
  await expect(page.getByRole('list')).toContainText('IMAGE');
});
