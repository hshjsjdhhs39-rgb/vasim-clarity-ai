import type { GestureEvent } from '../types/gesture';
import type { Landmark } from './gestures';

export type GestureCallback = (event: GestureEvent & { landmarks: Landmark[] }) => void;

export type HandServiceOptions = {
  lowPower?: boolean;
};

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'error'; error: string }
  | { type: 'gesture'; payload: { gesture: GestureEvent; landmarks: Landmark[] } };

type WorkerCommand =
  | { type: 'init'; options: { lowPower?: boolean } }
  | { type: 'frame'; imageBitmap: ImageBitmap; timestamp: number }
  | { type: 'stop' };

export class MediapipeHandService {
  private worker: Worker | null = null;
  private running = false;
  private listeners: Set<GestureCallback> = new Set();
  private frameRequest: number | null = null;
  private initialized = false;
  private processing = false;

  constructor(private video: HTMLVideoElement, private options: HandServiceOptions = {}) {}

  async start() {
    if (this.running) return;
    this.running = true;

    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/handWorker.ts', import.meta.url), {
        type: 'module'
      });
      this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === 'gesture') {
          for (const listener of this.listeners) {
            listener({ ...event.data.payload.gesture, landmarks: event.data.payload.landmarks });
          }
        }
        if (event.data.type === 'ready') {
          this.initialized = true;
        }
        if (event.data.type === 'error') {
          console.error('Hand worker error', event.data.error);
          this.initialized = false;
        }
      };
    }

    if (!this.initialized) {
      this.worker?.postMessage({ type: 'init', options: this.options } satisfies WorkerCommand);
    }

    const loop = async () => {
      if (!this.running) {
        return;
      }
      if (!this.video || this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.frameRequest = window.requestAnimationFrame(loop);
        return;
      }
      if (this.processing) {
        this.frameRequest = window.requestAnimationFrame(loop);
        return;
      }
      this.processing = true;
      try {
        if (typeof createImageBitmap !== 'function') {
          return;
        }
        const bitmap = await createImageBitmap(this.video);
        this.worker?.postMessage(
          { type: 'frame', imageBitmap: bitmap, timestamp: performance.now() } satisfies WorkerCommand,
          [bitmap]
        );
      } catch (error) {
        console.error('createImageBitmap failed', error);
      } finally {
        this.processing = false;
        this.frameRequest = window.requestAnimationFrame(loop);
      }
    };

    this.frameRequest = window.requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    this.worker?.postMessage({ type: 'stop' } satisfies WorkerCommand);
  }

  onGesture(callback: GestureCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  updateOptions(options: HandServiceOptions) {
    this.options = { ...this.options, ...options };
    this.worker?.postMessage({ type: 'init', options: this.options } satisfies WorkerCommand);
  }
}
