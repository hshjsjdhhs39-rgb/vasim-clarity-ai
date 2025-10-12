import React, { createContext, useContext, useMemo, useState } from 'react';

type Locale = 'en' | 'ar';

type Dictionary = Record<string, Record<Locale, string>>;

const dictionary: Dictionary = {
  title: {
    en: 'AI Gesture Canvas',
    ar: 'لوحة الإيماءات بالذكاء الاصطناعي'
  },
  promptPlaceholder: {
    en: 'Describe the art you want to see…',
    ar: 'صف العمل الفني الذي تريد رؤيته…'
  },
  generate: {
    en: 'Generate Image',
    ar: 'إنشاء الصورة'
  },
  animate: {
    en: 'Animate Image',
    ar: 'تحريك الصورة'
  },
  downloadImage: {
    en: 'Download Image',
    ar: 'تحميل الصورة'
  },
  downloadVideo: {
    en: 'Download Video',
    ar: 'تحميل الفيديو'
  },
  cameraUnavailable: {
    en: 'Camera unavailable. Check permissions.',
    ar: 'الكاميرا غير متاحة. تحقق من الأذونات.'
  },
  statusInitializing: {
    en: 'Initializing models…',
    ar: 'جاري تهيئة النماذج…'
  },
  statusGenerating: {
    en: 'Generating image…',
    ar: 'جاري إنشاء الصورة…'
  },
  statusAnimating: {
    en: 'Animating video…',
    ar: 'جاري تحريك الفيديو…'
  },
  clearConfirm: {
    en: 'Clear canvas?',
    ar: 'مسح اللوحة؟'
  },
  lowPower: {
    en: 'Low power mode',
    ar: 'وضع استهلاك منخفض'
  }
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: keyof typeof dictionary) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(
    navigator.language.startsWith('ar') ? 'ar' : 'en'
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dictionary[key][locale]
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
