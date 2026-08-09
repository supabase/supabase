# Templates Package Audit

## النتيجة

- عدد القوالب: **144**.
- الأنظمة: `auth`, `azabot`, `copilot`, `core`, `finance`, `maint`, `payments`, `prod`, `project`, `vision`.
- لكل قالب ملفات `html`, `txt`, `meta.json` متطابقة مع `catalog.json`.
- لا توجد Symlinks داخل الحزمة.
- لا توجد عناصر `<script>` أو `<form>` في قوالب البريد.
- مصادر الصور الوحيدة هي `{{logo_url}}`، والروابط ديناميكية ومقيدة في Renderer إلى HTTPS.
- لم يعثر الفحص الساكن على JWT أو Private Keys أو API keys فعلية.

## ملاحظات أصلية تم تصحيحها

1. `install.sh` كان يحاول نسخ مجلد `supabase` غير موجود داخل الملف المضغوط.
2. الحزمة كانت مكتبة Deno فقط ولا تحتوي HTTP runtime أو Dockerfile أو Compose.
3. `deno task check` يزامن Runtime إلى مسار خارجي نسبي؛ أضيف `container:check` مستقل لا يكتب خارج Build Context.
4. الملف `html_20260609_b72625.html` مرجع قديم غير موجود في Catalog؛ تم إبقاؤه خارج صورة Docker عبر `.dockerignore`.
5. خدمة الإرسال الجديدة معطلة افتراضيًا، وتحتاج Token داخليًا حتى لعمليات Render وقراءة Catalog.

## حدود الفحص

لم تتوفر أدوات `deno` أو `docker` داخل بيئة الفحص الحالية؛ لذلك لم يتم تنفيذ Docker Build فعلي. تم تنفيذ فحص بنيوي وساكن شامل، وفحوص اتساق Catalog والقوالب عبر Python. أوامر Deno والـDocker مضافة داخل مسار البناء لتفشل الصورة تلقائيًا إذا وجد TypeScript أو اختبار غير ناجح.

## فحوص إضافية نُفذت

- فُحصت **492** خانة داخل ZIP ولم توجد مسارات مطلقة أو `..` يمكن أن تسبب Zip Slip.
- اجتاز `docker-compose.yml` التحليل البنيوي عبر PyYAML.
- اجتازت سكربتات Bash فحص `bash -n`.
- اجتازت ملفات الخدمة والاختبارات فحص TypeScript الصارم باستخدام `tsc 5.8.3` مع تعريف Deno محلي للفحص الساكن.
- تم اختبار `install.sh` و`container-init.sh` في مجلد مؤقت، والتحقق من عدم نسخ الأسرار ومن صلاحياتها.
