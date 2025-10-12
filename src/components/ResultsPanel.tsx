import { Download, ImageIcon, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GeneratedAsset } from '../types/genai';
import { Button } from './ui/button';
import { downloadUrl } from '../services/download';
import { useI18n } from '../lib/i18n';

export type ResultsPanelProps = {
  assets: GeneratedAsset[];
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ assets }) => {
  const { t } = useI18n();

  if (!assets.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
        Generated results will appear here.
      </div>
    );
  }

  return (
    <div className="grid gap-4 overflow-y-auto pr-2" role="list">
      {assets.map((asset) => (
        <motion.article
          key={asset.id}
          layout
          className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4"
          role="listitem"
        >
          <header className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 font-medium text-white">
              {asset.type === 'image' ? (
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Video className="h-4 w-4" aria-hidden="true" />
              )}
              {asset.type.toUpperCase()}
            </span>
            <time dateTime={new Date(asset.createdAt).toISOString()}>
              {new Date(asset.createdAt).toLocaleTimeString()}
            </time>
          </header>
          <div className="overflow-hidden rounded-lg border border-white/10">
            {asset.type === 'image' ? (
              <img src={asset.url} alt={asset.prompt} className="w-full" />
            ) : (
              <video src={asset.url} controls className="w-full" aria-label={asset.prompt} />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p className="line-clamp-2">{asset.prompt}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => downloadUrl(asset.url, `${asset.id}.${asset.type === 'image' ? 'png' : 'mp4'}`)}
              aria-label={asset.type === 'image' ? t('downloadImage') : t('downloadVideo')}
            >
              <Download className="mr-2 h-4 w-4" />
              {asset.type === 'image' ? t('downloadImage') : t('downloadVideo')}
            </Button>
          </div>
        </motion.article>
      ))}
    </div>
  );
};
