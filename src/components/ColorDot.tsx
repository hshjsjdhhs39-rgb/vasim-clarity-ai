import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

type Props = {
  color: string;
  active?: boolean;
  ariaLabel?: string;
};

export const ColorDot: React.FC<Props> = ({ color, active = false, ariaLabel }) => (
  <motion.span
    aria-label={ariaLabel}
    role="img"
    className={cn(
      'inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-transparent transition-all',
      active && 'border-primary shadow-lg shadow-primary/40'
    )}
    style={{ backgroundColor: color }}
    initial={{ scale: 0.9 }}
    animate={{ scale: active ? 1.1 : 1 }}
    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
  />
);
