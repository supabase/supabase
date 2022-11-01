# Get User Location

This example shows how you can get user location based on the IP provided in X-Forwarded-For header in a request.

You will need to signup for an account in https://ipinfo.io and provide it as `IPINFO_TOKEN` environment variable ([learn how to set environment variables to your functions](https://supabase.com/docs/guides/functions#secrets-and-environment-variables)).

## Deploy

```bash
supabase functions deploy location --no-verify-jwt
```
