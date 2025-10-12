# AI Gesture Canvas

## English 🇺🇸

### Overview
AI Gesture Canvas lets you sketch mid-air with your hand and transform sketches into polished images and animated clips using Google Gemini. MediaPipe runs entirely in the browser to track gestures, while a lightweight React + Vite frontend keeps interactions responsive.

### Quick start
1. **Install:** `npm install`
2. **Configure env:** create `.env.local` with
   ```bash
   VITE_GOOGLE_API_KEY=your_google_api_key
   ```
   Leave empty to use offline stub assets.
3. **Run locally:** `npm run dev`
4. **Production build:** `npm run build`
5. **Preview build:** `npm run preview`

> Camera troubleshooting: ensure browser permission is granted. If the preview stays black, reload the page or pick a different camera in OS settings. CORS errors usually indicate an invalid API key.

### Deployment
- Any static host that supports SPA routing (Vercel, Netlify, Firebase Hosting, Cloudflare Pages).
- Build with `npm run build`, then deploy the `dist/` folder.
- Set `VITE_GOOGLE_API_KEY` in your deployment provider’s environment variables.

### Gestures & keyboard fallbacks
```
👉 Pointing finger   → Draw (Keyboard: D)
🖐️ Open palm         → Next color (Keyboard: C)
✊ Closed fist        → Clear canvas (Keyboard: X)
👍 Thumbs up          → Generate image (Keyboard: G)
🎞️ Animate button    → Animate latest image (Keyboard: A)
```

### Features
- Touchless drawing with MediaPipe Hand Landmarker running in a Web Worker.
- Prompt-aware image synthesis (Gemini `gemini-2.5-flash-image`).
- One-click video animation (Gemini `veo-2.0-generate-001`).
- Live status HUD, toast notifications, color palette cycling, low-power mode, and downloadable outputs.
- i18n with English/Arabic toggle, framer-motion micro-interactions, shadcn/ui styling.
- Stub mode keeps demos functional without an API key.

### Testing & quality
- Lint: `npm run lint`
- Unit tests: `npm run test`
- E2E smoke test: `npm run test:e2e`
- Husky pre-commit ensures lint + unit tests pass.

### Accessibility & privacy
- Live region updates for status + gestures.
- ARIA labels on camera feed, controls, and dialog prompts.
- Camera frames never leave the device; only the exported sketch PNG is sent to Gemini when enabled.

### Smoke checklist
1. Allow camera access when prompted.
2. Make the pointing gesture; a stroke should appear.
3. Use an open palm to cycle brush colors.
4. Form a fist; confirm the clear dialog and ensure the canvas resets.
5. Enter a prompt and show a thumbs-up (or press **G**); expect an image in the results pane.
6. Click **Animate Image** (or press **A**) to produce a short clip and download both assets.

---

## العربية 🇸🇦

### نظرة عامة
تتيح لك لوحة الإيماءات بالذكاء الاصطناعي الرسم في الهواء وتحويل الرسومات إلى صور متقنة ومقاطع متحركة بواسطة Google Gemini. تعمل تقنية MediaPipe محليًا داخل المتصفح لتتبع الإيماءات، بينما يوفر واجهة React + Vite تجربة سريعة وسلسة.

### البدء السريع
1. **التثبيت:** `npm install`
2. **إعداد المتغيرات:** أنشئ ملف `.env.local` يحتوي على:
   ```bash
   VITE_GOOGLE_API_KEY=مفتاح_جوجل_الخاصة_بك
   ```
   اتركه فارغًا لتجربة الوضع التجريبي دون مفاتيح.
3. **تشغيل محلي:** `npm run dev`
4. **بناء الإنتاج:** `npm run build`
5. **معاينة البناء:** `npm run preview`

> حل مشاكل الكاميرا: تأكد من منح الإذن للكاميرا. إذا ظل الفيديو أسود، أعد تحميل الصفحة أو اختر كاميرا مختلفة من إعدادات النظام. أخطاء CORS تعني غالبًا مفتاح API غير صحيح.

### النشر
- يمكن النشر على أي خدمة استضافة ثابتة تدعم تطبيقات SPA مثل Vercel أو Netlify أو Firebase أو Cloudflare.
- نفّذ `npm run build` ثم ارفع مجلد `dist/`.
- عيّن المتغير `VITE_GOOGLE_API_KEY` في إعدادات الاستضافة.

### الإيماءات واختصارات لوحة المفاتيح
```
👉 إصبع الإشارة   → رسم (لوحة المفاتيح: D)
🖐️ كف مفتوح      → تغيير اللون (لوحة المفاتيح: C)
✊ قبضة اليد      → مسح اللوحة (لوحة المفاتيح: X)
👍 إبهام للأعلى   → توليد صورة (لوحة المفاتيح: G)
🎞️ زر التحريك    → تحريك آخر صورة (لوحة المفاتيح: A)
```

### المزايا
- رسم بدون لمس باستخدام MediaPipe Hand Landmarker في Web Worker.
- توليد صور اعتمادًا على الوصف النصي (نموذج Gemini `gemini-2.5-flash-image`).
- توليد فيديو قصير من الصورة (نموذج Gemini `veo-2.0-generate-001`).
- واجهة تعرض حالة النظام، إشعارات، لوحة ألوان، وضع استهلاك منخفض، وإمكانية تحميل النتائج.
- دعم لغتين (إنجليزي/عربي)، وحركات انتقالية من framer-motion، وتصميم shadcn/ui.
- وضع تجريبي يعمل دون مفاتيح API.

### الاختبارات والجودة
- فحص الشيفرة: `npm run lint`
- اختبارات وحدات: `npm run test`
- اختبار شامل (E2E): `npm run test:e2e`
- خطاف Husky يتأكد من نجاح الفحص والاختبارات قبل الالتزام.

### إمكانية الوصول والخصوصية
- مناطق حية للإعلانات الصوتية عن الحالة والإيماءات.
- تسميات ARIA لعناصر الكاميرا والأزرار والحوار.
- لا تغادر إطارات الكاميرا جهازك؛ فقط صورة الرسم تُرسل إلى Gemini عند الاستخدام.

### قائمة التحقق السريعة
1. اسمح بالوصول إلى الكاميرا عند الطلب.
2. ارسم بالإشارة وشاهد الخط يظهر.
3. استخدم الكف المفتوح لتغيير اللون.
4. كوّن قبضة، وافق على مسح اللوحة.
5. اكتب وصفًا وارفع الإبهام (أو اضغط **G**) لتوليد صورة.
6. اضغط **Animate Image** (أو **A**) للحصول على فيديو قصير ثم قم بتحميل النتائج.
