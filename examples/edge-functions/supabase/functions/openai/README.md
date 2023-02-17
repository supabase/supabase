# openai

## Run locally

```bash
supabase functions serve --no-verify-jwt openai
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
```
