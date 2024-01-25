# Writing Supabase Edge Functions with Hono Server

This example demonstrates how to create a Supabase function using Hono Server.

## Run Locally

To run the function locally, use the following command:

```bash
supabase functions serve --no-verify-jwt
```

Make a POST request using cURL or Postman to `http://127.0.0.1:54321/functions/v1/hono-server/hello-world`:

```bash
curl --location 'http://127.0.0.1:54321/functions/v1/hono-server/hello-world'
```

## Deploy

Deploy the function with the following command:

```bash
supabase functions deploy hono-server --no-verify-jwt
```

Feel free to replace "hono-server" and "hello-world" with your specific function and endpoint names.