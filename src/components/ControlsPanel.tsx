import { motion } from 'framer-motion';
import { Sparkles, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { ColorDot } from './ColorDot';
import { useI18n } from '../lib/i18n';
import { IMAGE_MODEL, VIDEO_MODEL } from '../services/genaiClient';

export type ControlsPanelProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onAnimate: () => void;
  canAnimate: boolean;
  colors: string[];
  currentColor: string;
  statusMessage: string;
  lowPowerMode: boolean;
  onLowPowerToggle: (value: boolean) => void;
};

const gestureShortcuts = [
  { label: 'Point → Draw', key: 'D', gesture: '👉' },
  { label: 'Open Palm → Color', key: 'C', gesture: '🖐️' },
  { label: 'Fist → Clear', key: 'X', gesture: '✊' },
  { label: 'Thumbs Up → Generate', key: 'G', gesture: '👍' },
  { label: 'Animate', key: 'A', gesture: '🎞️' }
];

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  onAnimate,
  canAnimate,
  colors,
  currentColor,
  statusMessage,
  lowPowerMode,
  onLowPowerToggle
}) => {
  const { t, locale, setLocale } = useI18n();

  return (
    <aside className="flex h-full flex-col gap-6 overflow-hidden rounded-2xl bg-secondary/30 p-6 backdrop-blur">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" aria-live="polite">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              Draw with gestures, describe with words, let Gemini bring it to life.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            aria-label="Toggle language"
          >
            {locale === 'en' ? 'عربي' : 'EN'}
          </Button>
        </div>
      </header>

      <section aria-label="Prompt" className="space-y-3">
        <label htmlFor="prompt" className="text-sm font-medium text-muted-foreground">
          Prompt
        </label>
        <Textarea
          id="prompt"
          aria-label="Prompt text"
          placeholder={t('promptPlaceholder')}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="flex-1" onClick={onGenerate} aria-label={t('generate')}>
            <Sparkles className="mr-2 h-4 w-4" />
            {t('generate')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onAnimate}
            disabled={!canAnimate}
            aria-disabled={!canAnimate}
            aria-label={t('animate')}
          >
            <Video className="mr-2 h-4 w-4" />
            {t('animate')}
          </Button>
        </div>
        {statusMessage && (
          <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary-foreground" aria-live="polite">
            {statusMessage}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-label="Color palette">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Brush color</span>
          <span className="text-xs text-muted-foreground">{currentColor}</span>
        </div>
        <motion.div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <ColorDot key={color} color={color} active={color === currentColor} ariaLabel={`Color ${color}`} />
          ))}
        </motion.div>
      </section>

      <section className="space-y-2" aria-label="Performance options">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t('lowPower')}</p>
            <p className="text-xs text-muted-foreground">Reduce FPS to conserve battery.</p>
          </div>
          <Switch
            checked={lowPowerMode}
            onCheckedChange={(checked) => onLowPowerToggle(Boolean(checked))}
            aria-label="Toggle low power mode"
          />
        </div>
      </section>

      <section className="space-y-3" aria-label="Gesture cheat sheet">
        <h2 className="text-sm font-semibold text-muted-foreground">Gestures & shortcuts</h2>
        <ul className="grid gap-2 text-xs text-muted-foreground">
          {gestureShortcuts.map((item) => (
            <li key={item.key} className="flex items-center justify-between rounded-md bg-black/10 px-3 py-2">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="text-lg">
                  {item.gesture}
                </span>
                {item.label}
              </span>
              <span className="rounded bg-black/30 px-2 py-1 font-semibold text-white">{item.key}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto text-xs text-muted-foreground">
        Powered by Google Gemini models ({IMAGE_MODEL}) & ({VIDEO_MODEL}).
      </footer>
    </aside>
  );
};
