# stripe-webhooks

Also check out our full Stripe Payments examples for [React Native (Expo)](https://github.com/supabase-community/expo-stripe-payments-with-supabase-functions) and [Flutter](https://github.com/supabase-community/flutter-stripe-payments-with-supabase-functions).

## Setup env vars

- `cp supabase/.env.local.example supabase/.env.local`

## Test locally

- Terminal 1:
  - `supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local`
- Terminal 2:
  - `stripe listen --forward-to localhost:54321/functions/v1/`
- Terminal 3 (optional):
  - `stripe trigger payment_intent.succeeded`

## Deploy

- `supabase functions deploy --no-verify-jwt stripe-webhooks`
- `supabase secrets set --env-file ./supabase/.env.local`
