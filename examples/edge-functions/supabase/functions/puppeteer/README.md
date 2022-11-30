# Using Puppeteer

This example shows how you can use Puppeteer and a headless-browser to generate screenshots of a web page. Pass the `url` of the web page as a query string.

Since Edge Functions cannot run a Headless Browser instance due to resource constraints, you will need to use a hosted browser service like https://browserless.io.

## Deploy

```bash
supabase functions deploy puppeteer --no-verify-jwt
```
