import { useCallback, useEffect, useRef } from 'react';
import { useAppStore, selectCurrentColor } from '../store/useAppStore';
import type { GestureEvent } from '../types/gesture';
import type { Landmark } from '../services/gestures';
import { MediapipeHandService } from '../services/mediapipeHand';
import type { Point } from '../services/canvasPainter';

export type HandTrackingHandlers = {
  onThumbsUp: () => void;
  onColorCycle: (color: string) => void;
  onClear: () => void;
  onAnimate: () => void;
};

type PainterControls = {
  start: (point: Point) => void;
  draw: (point: Point) => void;
  end: () => void;
  clear: () => void;
};

const INDEX_TIP = 8;
const GESTURE_COOLDOWN = 550;

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  painter: PainterControls,
  handlers: HandTrackingHandlers
) => {
  const setGesture = useAppStore((state) => state.setGesture);
  const nextColor = useAppStore((state) => state.nextColor);
  const setStatus = useAppStore((state) => state.setStatus);
  const lowPowerMode = useAppStore((state) => state.lowPowerMode);

  const lastGestureRef = useRef<{ type: GestureEvent['type']; timestamp: number }>({
    type: 'idle',
    timestamp: 0
  });
  const drawingRef = useRef(false);
  const serviceRef = useRef<MediapipeHandService | null>(null);

  const handleGesture = useCallback(
    (gesture: GestureEvent, landmarks: Landmark[]) => {
      if (!canvasRef.current) return;

      const now = performance.now();
      const last = lastGestureRef.current;
      if (gesture.type !== last.type && gesture.confidence > 0.5) {
        lastGestureRef.current = { type: gesture.type, timestamp: now };
      } else if (gesture.type === last.type && now - last.timestamp < GESTURE_COOLDOWN) {
        return;
      }

      setGesture(gesture.type);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      if (gesture.type === 'point' && landmarks[INDEX_TIP]) {
        const tip = landmarks[INDEX_TIP];
        const point: Point = {
          x: tip.x * rect.width,
          y: tip.y * rect.height,
          time: now
        };
        if (!drawingRef.current) {
          painter.start(point);
          drawingRef.current = true;
        } else {
          painter.draw(point);
        }
        return;
      }

      if (drawingRef.current && gesture.type !== 'point') {
        painter.end();
        drawingRef.current = false;
      }

      if (gesture.type === 'open-palm') {
        nextColor();
        const next = selectCurrentColor(useAppStore.getState());
        handlers.onColorCycle(next);
        setStatus('');
      }

      if (gesture.type === 'fist') {
        handlers.onClear();
      }

      if (gesture.type === 'thumbs-up') {
        handlers.onThumbsUp();
      }
    },
    [canvasRef, handlers, painter, setGesture, setStatus, nextColor]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const service = new MediapipeHandService(video, { lowPower: lowPowerMode });
    serviceRef.current = service;
    const unsubscribe = service.onGesture(({ confidence, type, landmarks }) => {
      if (confidence < 0.4) {
        return;
      }
      handleGesture({ type, confidence }, landmarks);
    });
    service.start().catch((error) => {
      console.error('Failed to start hand tracking', error);
      setStatus('Camera unavailable. Check permissions.');
    });

    return () => {
      unsubscribe();
      service.stop();
    };
  }, [handleGesture, lowPowerMode, setStatus, videoRef]);

  useEffect(() => {
    serviceRef.current?.updateOptions({ lowPower: lowPowerMode });
  }, [lowPowerMode]);

  useEffect(() => {
    if (!videoRef.current) return;

    const requestCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        videoRef.current!.srcObject = stream;
        await videoRef.current!.play();
      } catch (error) {
        console.error('Camera access denied', error);
        setStatus('Camera unavailable. Check permissions.');
      }
    };

    requestCamera();
  }, [setStatus, videoRef]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'd') {
        drawingRef.current = !drawingRef.current;
      }
      if (key === 'c') {
        nextColor();
        const next = selectCurrentColor(useAppStore.getState());
        handlers.onColorCycle(next);
      }
      if (key === 'x') {
        handlers.onClear();
      }
      if (key === 'g') {
        handlers.onThumbsUp();
      }
      if (key === 'a') {
        handlers.onAnimate();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlers, nextColor]);
};
