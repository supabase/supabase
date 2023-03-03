# openai

## Setup env vars

```bash
cp supabase/.env.local.example supabase/.env.local
```

## Run locally

```bash
supabase functions serve --env-file ./supabase/.env.local --no-verify-jwt
```

Use cURL or Postman to make a POST request to http://localhost:54321/functions/v1/openai.

```bash
curl -i --location --request POST http://localhost:54321/functions/v1/openai \
  --header 'Content-Type: application/json' \
  --data '{"query":"What is Supabase?"}'
```

## Deploy

```bash
supabase functions deploy --no-verify-jwt openai
supabase secrets set --env-file ./supabase/.env.local
```
