```markdown
# Simple Persistent Browser API

این پروژه یک API ساده برای کنترل مرورگر (Playwright) است که برای هر ایمیل یک پروفایل persistent روی دیسک می‌سازد. هدف: تجربهٔ «یک کاربر که پشت مرورگر نشسته» — لاگین، کوکی‌ها و localStorage حفظ می‌شن.

نحوهٔ استفاده (خیلی ساده):
1. همهٔ فایل‌ها را در یک پوشه قرار بده.
2. در آن پوشه دستورها را اجرا کن:
   npm install
   npm start

   (در اولین نصب Playwright مرورگرها را دانلود می‌کند)

3. مثال‌های ساده:
   - ساخت session برای ایمیل:
     curl -X POST http://localhost:3000/browser -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
     پاسخ: { "sessionId": "<id>" }

   - رفتن به صفحه:
     curl -X POST http://localhost:3000/browser/<SESSION>/goto -H "Content-Type: application/json" -d '{"url":"https://example.com"}'

   - گرفتن title با eval:
     curl -X POST http://localhost:3000/browser/<SESSION>/eval -H "Content-Type: application/json" -d '{"script":"document.title"}'

   - اسکرین‌شات:
     curl http://localhost:3000/browser/<SESSION>/screenshot -o shot.png

   - بستن session:
     curl -X DELETE http://localhost:3000/browser/<SESSION>

نکته‌های مهم:
- پروفایل‌ها در ./profiles/<hash> ذخیره می‌شوند و لاگین حفظ می‌شود.
- سرور باید در محیطی اجرا شود که Node.js و قابلیت اجرای Playwright (دانلود مرورگرها) را دارد.
- سرویس‌هایی مثل Netlify/Vercel معمولاً برای اجرای این نوع سرور مناسب نیستند.
```