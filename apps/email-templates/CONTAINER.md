# Alazab Email Templates Container

هذه الحاوية تحول مكتبة القوالب إلى خدمة داخلية مستقلة للعرض والإرسال. تحتوي الصورة على 144 قالبًا مترجمًا داخل Executable واحد؛ لا تحتاج ملفات القوالب إلى Volume في وقت التشغيل.

## الحماية الافتراضية

- المنفذ مربوط على `127.0.0.1` فقط.
- جميع المسارات عدا `/`, `/healthz`, `/readyz` تحتاج Bearer Token.
- الإرسال الفعلي معطل افتراضيًا (`ENABLE_SEND=false`).
- الحاوية تعمل بغير root، بنظام ملفات read-only، ومن دون Linux capabilities.
- أسرار المزودين تقرأ من ملفات داخل `./secrets`.
- لا يقبل CORS إلا Origins تُذكر صراحة في `ALLOWED_ORIGINS`، ولا يقبل `*`.
- لا يعيد استجابة مزود البريد الخام للعميل.

## التشغيل

```bash
./scripts/container-init.sh

docker compose --env-file .env.container up -d --build
./scripts/container-smoke.sh
```

## المسارات

| Method | Path | الوظيفة | الحماية |
|---|---|---|---|
| GET | `/healthz` | Liveness | عام |
| GET | `/readyz` | جاهزية Token والمزود وعدد القوالب | عام، بلا أسرار |
| GET | `/v1/templates` | فهرس القوالب دون HTML/Text | Token |
| GET | `/v1/templates/{id}` | تعريف قالب واحد | Token |
| POST | `/v1/render` | إنتاج Subject/HTML/Text | Token |
| POST | `/v1/send` | إنتاج وإرسال الرسالة | Token + `ENABLE_SEND=true` |

## المصادقة

```bash
TOKEN="$(<secrets/templates_api_token)"
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8080/v1/templates
```

## مثال Render

```bash
curl -sS -X POST http://127.0.0.1:8080/v1/render \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{
    "templateId": "az.maint.statement_review.ar.v1",
    "data": {
      "recipient_name": "المهندس محمد",
      "reference": "MS-2026-0042",
      "details": [
        {"label": "العميل", "value": "أبو عوف"},
        {"label": "الإجمالي", "value": "125,000 جنيه"}
      ],
      "action_url": "https://uberfix.alazab.com/statements/MS-2026-0042"
    }
  }'
```

## تفعيل الإرسال عبر Resend

```bash
chmod 600 secrets/resend_api_key
printf '%s' 're_replace_with_real_key' > secrets/resend_api_key
chmod 444 secrets/resend_api_key
sed -i 's/^ENABLE_SEND=.*/ENABLE_SEND=true/' .env.container
sed -i 's/^EMAIL_PROVIDER=.*/EMAIL_PROVIDER=resend/' .env.container

docker compose --env-file .env.container up -d --build
```

## Webhook Gateway

ضع السر في `secrets/email_webhook_secret`، ثم اضبط:

```env
ENABLE_SEND=true
EMAIL_PROVIDER=webhook
EMAIL_WEBHOOK_URL=https://mail-gateway.example.com/send
```

## بناء صورة ثابتة

```bash
IMAGE_TAG="$(date +%Y%m%d)-$(sha256sum catalog.json | cut -c1-12)"
docker build \
  --build-arg DENO_VERSION=2.4.3 \
  -t "ghcr.io/alazabdev/email-templates:${IMAGE_TAG}" .
```
