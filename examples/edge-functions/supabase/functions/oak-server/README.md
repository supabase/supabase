# Writing functions using Oak Server Middleware

This example shows how you can write functions using Oak server middleware (https://oakserver.github.io/oak/)

## Run locally

```bash
supabase functions serve --no-verify-jwt
```

Use cURL or Postman to make a POST request to http://localhost:54321/functions/v1/oak-server/greet.

```
  curl --location --request POST 'http://localhost:54321/functions/v1/oak-server/greet' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{ "name": "John Doe" }'
```

## Deploy

```bash
supabase functions deploy oak-server --no-verify-jwt
```
