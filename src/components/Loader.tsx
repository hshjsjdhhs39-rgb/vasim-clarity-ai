import { motion } from 'framer-motion';

export const Loader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-4" role="status" aria-live="polite">
    <motion.span
      className="h-10 w-10 rounded-full border-4 border-primary/40 border-t-primary"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    />
    {label && <span className="text-sm text-muted-foreground">{label}</span>}
  </div>
);
