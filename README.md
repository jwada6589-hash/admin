# لوحة إدارة ماركت المرتضى

لوحة الإدارة مرتبطة بقاعدة البيانات الحقيقية على Convex Cloud:

- Project: `al-murtada-market`
- Deployment: `hushed-zebra-824` (Production)
- Cloud URL: `https://hushed-zebra-824.convex.cloud`

## التشغيل المحلي

```bash
cp admin-web/.env.example admin-web/.env.local
npm install
npm run dev
```

ثم افتح `http://localhost:5174/admin/login`.

## النشر

أي Push إلى فرع `main` يبني لوحة الإدارة وينشرها تلقائياً على GitHub Pages.

ملفات الأسرار ومفاتيح Convex الخاصة بالنشر مستبعدة من Git. عنوان Convex الموجود في إعداد البناء هو عنوان عميل عام، بينما كلمات المرور والجلسات والتحقق والصلاحيات تنفذ داخل Backend Convex.
