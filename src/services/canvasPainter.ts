export type Point = { x: number; y: number; time: number };

export type Stroke = {
  color: string;
  points: Point[];
};

const DEFAULT_LINE_WIDTH = 6;
const SMOOTHING_FACTOR = 0.45;

export class CanvasPainter {
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private lastPoint: Point | null = null;

  constructor(
    private canvas:
      | HTMLCanvasElement
      | OffscreenCanvas,
    private options: { devicePixelRatio?: number; lowPower?: boolean } = {}
  ) {
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('2D context unavailable');
    }
    this.ctx = context;
    this.configureContext();
  }

  private configureContext() {
    const { devicePixelRatio = window.devicePixelRatio || 1 } = this.options;
    if ('width' in this.canvas) {
      this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
      this.canvas.height = this.canvas.clientHeight * devicePixelRatio;
    }
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = this.options.lowPower ? DEFAULT_LINE_WIDTH * 0.75 : DEFAULT_LINE_WIDTH;
  }

  resize(width: number, height: number) {
    const ratio = this.options.devicePixelRatio ?? window.devicePixelRatio ?? 1;
    if ('width' in this.canvas) {
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
    }
    this.redraw();
  }

  startStroke(color: string, point: Point) {
    this.currentStroke = { color, points: [point] };
    this.strokes.push(this.currentStroke);
    this.lastPoint = point;
  }

  addPoint(point: Point) {
    if (!this.currentStroke || !this.lastPoint) {
      return;
    }

    const smoothed = this.applySmoothing(point);
    this.currentStroke.points.push(smoothed);
    this.drawSegment(this.lastPoint, smoothed, this.currentStroke.color);
    this.lastPoint = smoothed;
  }

  endStroke() {
    this.currentStroke = null;
    this.lastPoint = null;
  }

  clear() {
    this.strokes = [];
    const canvasWidth = 'width' in this.canvas ? this.canvas.width : 0;
    const canvasHeight = 'height' in this.canvas ? this.canvas.height : 0;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  redraw() {
    const canvasWidth = 'width' in this.canvas ? this.canvas.width : 0;
    const canvasHeight = 'height' in this.canvas ? this.canvas.height : 0;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    for (const stroke of this.strokes) {
      for (let i = 1; i < stroke.points.length; i += 1) {
        this.drawSegment(stroke.points[i - 1], stroke.points[i], stroke.color);
      }
    }
  }

  exportPNG(): Promise<Blob> {
    if (this.canvas instanceof HTMLCanvasElement) {
      return new Promise((resolve, reject) => {
        this.canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to export canvas'));
            return;
          }
          resolve(blob);
        }, 'image/png');
      });
    }
    return Promise.resolve(this.canvas.convertToBlob({ type: 'image/png' }));
  }

  private drawSegment(from: Point, to: Point, color: string) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  private applySmoothing(point: Point): Point {
    if (!this.lastPoint) {
      return point;
    }
    const alpha = this.options.lowPower ? SMOOTHING_FACTOR * 0.6 : SMOOTHING_FACTOR;
    return {
      x: alpha * point.x + (1 - alpha) * this.lastPoint.x,
      y: alpha * point.y + (1 - alpha) * this.lastPoint.y,
      time: point.time
    };
  }
}
