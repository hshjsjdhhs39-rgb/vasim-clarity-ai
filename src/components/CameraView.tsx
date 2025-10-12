import { motion } from 'framer-motion';
import type { GestureType } from '../types/gesture';
import { GestureBadge } from './GestureBadge';

export type CameraViewProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gesture: GestureType;
  statusMessage: string;
};

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  gesture,
  statusMessage
}) => (
  <section className="relative flex h-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black">
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      muted
      playsInline
      aria-label="Live camera feed"
    />
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="Drawing canvas"
      role="img"
    />
    <div className="pointer-events-none absolute top-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
      <GestureBadge gesture={gesture} />
      {statusMessage && (
        <motion.span
          className="rounded-full bg-black/60 px-3 py-1 text-xs text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          {statusMessage}
        </motion.span>
      )}
    </div>
  </section>
);
