import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasPainter, type Point } from '../services/canvasPainter';
import { useAppStore, selectCurrentColor } from '../store/useAppStore';

export const useCanvasPainter = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const color = useAppStore(selectCurrentColor);
  const lowPowerMode = useAppStore((state) => state.lowPowerMode);
  const [painter, setPainter] = useState<CanvasPainter | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const instance = new CanvasPainter(canvas, { lowPower: lowPowerMode });
    setPainter(instance);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      instance.resize(rect.width, rect.height);
    };

    resize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, lowPowerMode]);

  useEffect(() => {
    if (painter) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        painter.resize(rect.width, rect.height);
      }
    }
  }, [canvasRef, painter]);

  const start = useCallback(
    (point: Point) => {
      if (!painter) return;
      drawingRef.current = true;
      painter.startStroke(color, point);
    },
    [color, painter]
  );

  const draw = useCallback(
    (point: Point) => {
      if (!painter || !drawingRef.current) return;
      painter.addPoint(point);
    },
    [painter]
  );

  const end = useCallback(() => {
    if (!painter) return;
    drawingRef.current = false;
    painter.endStroke();
  }, [painter]);

  const clear = useCallback(() => {
    painter?.clear();
  }, [painter]);

  const exportPNG = useCallback(() => {
    if (!painter) {
      return Promise.reject(new Error('Painter not ready'));
    }
    return painter.exportPNG();
  }, [painter]);

  return {
    painter,
    start,
    draw,
    end,
    clear,
    exportPNG
  };
};
