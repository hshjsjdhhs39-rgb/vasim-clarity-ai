import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { CameraView } from './components/CameraView';
import { ControlsPanel } from './components/ControlsPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { Loader } from './components/Loader';
import { useCanvasPainter } from './hooks/useCanvasPainter';
import { useHandTracking } from './hooks/useHandTracking';
import { createGenAIClient } from './services/genaiClient';
import { useAppStore, selectCurrentColor } from './store/useAppStore';
import type { GeneratedAsset } from './types/genai';
import { useI18n } from './lib/i18n';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { painter, start, draw, end, clear, exportPNG } = useCanvasPainter(canvasRef);
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const colors = useAppStore((state) => state.colors);
  const currentColor = useAppStore(selectCurrentColor);
  const assets = useAppStore((state) => state.assets);
  const addAsset = useAppStore((state) => state.addAsset);
  const gesture = useAppStore((state) => state.gesture);
  const statusMessage = useAppStore((state) => state.statusMessage);
  const setStatus = useAppStore((state) => state.setStatus);
  const resetStatus = useAppStore((state) => state.resetStatus);
  const lowPowerMode = useAppStore((state) => state.lowPowerMode);
  const setLowPowerMode = useAppStore((state) => state.setLowPowerMode);
  const { t } = useI18n();

  const client = useMemo(() => createGenAIClient(), []);
  const [pendingClear, setPendingClear] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState<'image' | 'video' | null>(null);

  useEffect(() => {
    setStatus(t('statusInitializing'));
    const timer = window.setTimeout(() => resetStatus(), 1200);
    return () => window.clearTimeout(timer);
  }, [resetStatus, setStatus, t]);

  useEffect(() => {
    if (client.isStub) {
      toast.warning('GOOGLE_API_KEY missing. Running in offline demo mode.');
    }
  }, [client.isStub]);

  const latestImage = useMemo<GeneratedAsset | undefined>(() => {
    return assets.find((asset) => asset.type === 'image');
  }, [assets]);

  const handleClearConfirm = useCallback(() => {
    clear();
    setPendingClear(false);
    toast.success('Canvas cleared');
  }, [clear]);

  const handleGenerate = useCallback(async () => {
    if (!painter) {
      toast.error('Canvas not ready yet.');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Please provide a prompt before generating.');
      return;
    }
    try {
      setLoadingAsset('image');
      setStatus(t('statusGenerating'));
      const sketch = await exportPNG();
      const asset = await client.generateImage({ prompt: prompt.trim(), sketch });
      addAsset(asset);
      toast.success('Image generated');
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
      setStatus('Image generation failed.');
    } finally {
      setLoadingAsset(null);
      setTimeout(() => resetStatus(), 800);
    }
  }, [addAsset, client, exportPNG, painter, prompt, resetStatus, setStatus, t]);

  const handleAnimate = useCallback(async () => {
    if (!latestImage) {
      toast.error('Generate an image first.');
      return;
    }
    try {
      setLoadingAsset('video');
      setStatus(t('statusAnimating'));
      const asset = await client.generateVideo(latestImage);
      addAsset(asset);
      toast.success('Animation ready');
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
      setStatus('Video generation failed.');
    } finally {
      setLoadingAsset(null);
      setTimeout(() => resetStatus(), 800);
    }
  }, [addAsset, client, latestImage, resetStatus, setStatus, t]);

  useHandTracking(
    videoRef,
    canvasRef,
    { start, draw, end, clear },
    {
      onThumbsUp: handleGenerate,
      onColorCycle: (color) => toast(`Color changed to ${color}`),
      onClear: () => setPendingClear(true),
      onAnimate: handleAnimate
    }
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6 lg:flex-row">
      <CameraView videoRef={videoRef} canvasRef={canvasRef} gesture={gesture} statusMessage={statusMessage} />

      <div className="flex h-[80vh] w-full flex-col gap-4 lg:w-[420px]">
        <ControlsPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onAnimate={handleAnimate}
          canAnimate={Boolean(latestImage)}
          colors={colors}
          currentColor={currentColor}
          statusMessage={statusMessage}
          lowPowerMode={lowPowerMode}
          onLowPowerToggle={setLowPowerMode}
        />
        <ResultsPanel assets={assets} />
      </div>

      <Toaster position="bottom-right" richColors />

      <AnimatePresence>
        {pendingClear && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={t('clearConfirm')}
          >
            <motion.div
              className="w-[320px] rounded-xl bg-background p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold">{t('clearConfirm')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will remove your current sketch. Continue?
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingClear(false)}
                  className="rounded-md border border-input px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearConfirm}
                  className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loadingAsset && (
          <motion.div
            className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/70 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Loader label={loadingAsset === 'image' ? t('statusGenerating') : t('statusAnimating')} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default App;
