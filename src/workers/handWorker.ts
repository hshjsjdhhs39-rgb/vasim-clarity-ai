/* eslint-disable no-restricted-globals */
import { detectGesture } from '../services/gestures';
import type { GestureEvent } from '../types/gesture';
import type { Landmark } from '../services/gestures';

type MediapipeModule = {
  FilesetResolver: {
    forVisionTasks: (basePath: string) => Promise<unknown>;
  };
  HandLandmarker: {
    createFromOptions: (resolver: unknown, options: Record<string, unknown>) => Promise<any>;
  };
};

let landmarker: any = null;
let lowPowerMode = false;

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const MP_BUNDLE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs';

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let modulePromise: Promise<MediapipeModule> | null = null;

const loadModule = async () => {
  if (!modulePromise) {
    modulePromise = import(/* @vite-ignore */ MP_BUNDLE_URL) as Promise<MediapipeModule>;
  }
  return modulePromise;
};

const ensureLandmarker = async () => {
  if (landmarker) {
    return landmarker;
  }
  const { FilesetResolver, HandLandmarker } = await loadModule();
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
  );
  landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: MODEL_URL
    },
    numHands: 1,
    runningMode: 'VIDEO'
  });
  return landmarker;
};

type InitMessage = { type: 'init'; options: { lowPower?: boolean } };
type FrameMessage = { type: 'frame'; imageBitmap: ImageBitmap; timestamp: number };
type StopMessage = { type: 'stop' };

type WorkerMessage = InitMessage | FrameMessage | StopMessage;

ctx.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;

  try {
    if (data.type === 'init') {
      lowPowerMode = Boolean(data.options.lowPower);
      await ensureLandmarker();
      ctx.postMessage({ type: 'ready' });
      return;
    }

    if (data.type === 'stop') {
      landmarker?.close();
      landmarker = null;
      return;
    }

    if (data.type === 'frame') {
      const instance = await ensureLandmarker();
      const result = instance.detectForVideo(data.imageBitmap, data.timestamp);
      data.imageBitmap.close();
      if (!result || !result.landmarks.length) {
        return;
      }
      const landmarks = result.landmarks[0].map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })) as Landmark[];
      const gesture: GestureEvent = detectGesture(landmarks);
      if (gesture.confidence < 0.5 && lowPowerMode) {
        return;
      }
      ctx.postMessage({
        type: 'gesture',
        payload: {
          gesture,
          landmarks
        }
      });
      return;
    }
  } catch (error) {
    console.error('Hand worker failure', error);
    ctx.postMessage({ type: 'error', error: (error as Error).message });
  }
};
