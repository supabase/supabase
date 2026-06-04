# Resend email template

Adds a queued transactional email pipeline using Resend. Application code enqueues an email in Postgres, `pg_cron` invokes an Edge Function worker, and delivery status is tracked in `public.email_messages`.

## How it works

1. Call `public.enqueue_email(...)`.
2. The email row is inserted with `queued` status and a message is sent to the `email_jobs` queue.
3. A cron job invokes the `send-email` worker with queued jobs.
4. The worker calls Resend and updates the row to `sent` or `failed`.
5. The `resend-webhook` function provides a small status update placeholder for Resend webhooks.

## Configuration

Set these secrets:

```sh
supabase secrets set RESEND_API_KEY=...
supabase secrets set RESEND_FROM_EMAIL="Acme <hello@example.com>"
```

## Includes

- `supabase/schemas/resend-email.sql` - email table, queue helpers, and cron dispatcher
- `supabase/functions/send-email/index.ts` - Resend worker
- `supabase/functions/resend-webhook/index.ts` - delivery webhook placeholder
