# تهيئة Git داخل مجلدك (قد لا تحتاج هذا الأمر إذا كان المجلد يحتوي بالفعل على مجلد .git مخفي)
git init

# ربط مجلدك المحلي بالمستودع على GitHub
git remote add origin https://github.com/hshjsjdhhs39-rgb/vasim-clarity-ai.git

# إضافة كل الملفات لعملية الرفع
git add .
git commit -m "Initial commit from Gemini AI Builder"

# التأكد من أن الفرع الرئيسي اسمه main
git branch -M main

# رفع الكود فعلياً إلى موقع GitHub
git push -u origin main