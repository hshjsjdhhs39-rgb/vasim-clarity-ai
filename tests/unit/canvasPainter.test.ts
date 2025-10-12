import { describe, expect, it, vi } from 'vitest';
import { CanvasPainter } from '../../src/services/canvasPainter';

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  const ctx = {
    lineJoin: 'round',
    lineCap: 'round',
    lineWidth: 0,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn()
  } as unknown as CanvasRenderingContext2D;
  // @ts-expect-error mocking context
  canvas.getContext = vi.fn(() => ctx);
  canvas.toBlob = (callback: BlobCallback) => {
    callback(new Blob(['stub'], { type: 'image/png' }));
  };
  Object.defineProperty(canvas, 'clientWidth', { value: 200 });
  Object.defineProperty(canvas, 'clientHeight', { value: 200 });
  return { canvas, ctx };
};

describe('CanvasPainter', () => {
  it('draws smoothed strokes', () => {
    const { canvas, ctx } = createCanvas();
    const painter = new CanvasPainter(canvas);
    painter.startStroke('#fff', { x: 10, y: 10, time: 0 });
    painter.addPoint({ x: 30, y: 30, time: 1 });
    painter.endStroke();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('exports png blob', async () => {
    const { canvas } = createCanvas();
    const painter = new CanvasPainter(canvas);
    const blob = await painter.exportPNG();
    expect(blob.type).toBe('image/png');
  });
});
