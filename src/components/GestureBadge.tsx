import { motion } from 'framer-motion';
import { Finger, Hand, Paintbrush, Sparkles, ThumbsUp } from 'lucide-react';
import type { GestureType } from '../types/gesture';
import { cn } from '../utils/cn';

const gestureIconMap: Record<GestureType, React.ReactNode> = {
  idle: <Hand className="h-4 w-4" aria-hidden="true" />,
  point: <Finger className="h-4 w-4" aria-hidden="true" />,
  'open-palm': <Paintbrush className="h-4 w-4" aria-hidden="true" />,
  fist: <Hand className="h-4 w-4" aria-hidden="true" />,
  'thumbs-up': <ThumbsUp className="h-4 w-4" aria-hidden="true" />
};

const gestureLabelMap: Record<GestureType, string> = {
  idle: 'Idle',
  point: 'Drawing',
  'open-palm': 'Color',
  fist: 'Clear',
  'thumbs-up': 'Generate'
};

type Props = {
  gesture: GestureType;
};

export const GestureBadge: React.FC<Props> = ({ gesture }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    key={gesture}
    className={cn(
      'flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white shadow-lg backdrop-blur'
    )}
    role="status"
    aria-live="polite"
  >
    {gestureIconMap[gesture]}
    <span>{gestureLabelMap[gesture]}</span>
  </motion.div>
);
