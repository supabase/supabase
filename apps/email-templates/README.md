# Alazab / AzaBot Production Email Templates

حزمة إنتاجية موحدة لقوالب البريد التي يستخدمها وكلاء العزب. مصدر القوالب الوحيد هو:

```text
azabot/supabase/templates/
```

تحتوي الحزمة على **144 قالبًا** موزعة على عشرة وكلاء. لم يُستخدم تصميم الملف المرجعي؛ تم بناء تصميم جديد متوافق مع عملاء البريد باستخدام جداول HTML وCSS مضمّن.

## الهيكل

```text
azabot/supabase/
├── templates/                         # مصدر القوالب الوحيد
│   ├── templates/<system>/*.html      # HTML مستقل لكل حدث
│   ├── templates/<system>/*.txt       # Plain text مستقل لكل حدث
│   ├── templates/<system>/*.meta.json # تعريف القالب ومتغيراته
│   ├── src/                           # Renderer + validation + providers
│   ├── scripts/                       # build / validate / sync-runtime
│   ├── tests/
│   ├── catalog.json
│   └── CATALOG.md
└── functions/
    ├── _shared/email-templates/       # نسخة Runtime مولّدة؛ لا تعدل يدويًا
    └── send-template-email/           # Edge Function للإرسال
```

## واجهة البيانات الموحدة

كل قالب يقبل نفس البنية الآمنة:

```json
{
  "recipient_name": "المهندس محمد",
  "reference": "MS-2026-0042",
  "message": "نص اختياري يستبدل النص الافتراضي للقالب.",
  "status_label": "للمراجعة",
  "status_tone": "warning",
  "details": [
    { "label": "العميل", "value": "أبو عوف" },
    { "label": "إجمالي المستخلص", "value": "125,000 جنيه" }
  ],
  "action_url": "https://uberfix.alazab.com/statements/MS-2026-0042",
  "action_label": "مراجعة المستخلص",
  "alert_title": "تنبيه",
  "alert_message": "يرجى الرد قبل تاريخ الاستحقاق.",
  "alert_tone": "warning"
}
```

جميع القيم تُهَرَّب عند إنتاج HTML. لا توجد متغيرات Raw HTML، والروابط الإنتاجية يجب أن تستخدم HTTPS.

## البناء والفحص

```bash
cd azabot/supabase/templates

deno task check
deno task test
```

`deno task check` ينفذ الآتي:

1. يبني `src/catalog.generated.ts` من ملفات المصدر.
2. يفحص TypeScript.
3. يرندر القوالب الـ144 ويتأكد من عدم بقاء أي متغير غير محلول.
4. يولد نسخة Runtime داخل `supabase/functions/_shared/email-templates`.

## التشغيل المحلي

```bash
cd azabot
cp supabase/functions/.env.email.example supabase/functions/.env.email.local
# عدل القيم الحقيقية محليًا فقط

supabase functions serve send-template-email \
  --no-verify-jwt \
  --env-file supabase/functions/.env.email.local
```

اختبار الصحة:

```bash
curl -sS http://127.0.0.1:54321/functions/v1/send-template-email
```

اختبار إرسال:

```bash
curl -sS -X POST \
  http://127.0.0.1:54321/functions/v1/send-template-email \
  -H 'content-type: application/json' \
  -H 'x-email-internal-secret: YOUR_SECRET' \
  --data @supabase/templates/examples/maint.json
```

## النشر

```bash
cd azabot

supabase secrets set --env-file supabase/functions/.env.email.local
supabase functions deploy send-template-email --no-verify-jwt
```

الوظيفة لا تعتمد على JWT العام؛ هي Endpoint داخلي وتتحقق من `x-email-internal-secret` بمقارنة ثابتة الزمن. لا تُعرَض هذه القيمة في المتصفح.

## مزودو الإرسال

### Resend

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx
```

### Webhook Gateway

```env
EMAIL_PROVIDER=webhook
EMAIL_WEBHOOK_URL=https://mail-gateway.example.com/send
EMAIL_WEBHOOK_SECRET=...
```

استخدام Webhook يسمح بتوصيل الحزمة لاحقًا بـAWS SES أو SMTP Gateway أو أي مزود مؤسسي دون تعديل القوالب أو الـRenderer.

## قاعدة التعديل

- عدّل ملفات `templates/<system>/` و`catalog.json` فقط.
- بعد التعديل شغّل `deno task check`.
- لا تعدل `src/catalog.generated.ts` أو `functions/_shared/email-templates` يدويًا.

## حاوية القوالب المستقلة

تمت إضافة خدمة داخلية جاهزة للحاويات توفر Catalog وRender وإرسال اختياري عبر Resend أو Webhook. الإرسال معطل افتراضيًا، وجميع واجهات `/v1/*` محمية برمز داخلي.

راجع [`CONTAINER.md`](./CONTAINER.md)، ثم شغّل:

```bash
./scripts/container-init.sh
docker compose --env-file .env.container up -d --build
./scripts/container-smoke.sh
```
