---
title: 'Rate limits'
subtitle: 'Rate limits protect your services from abuse'
---

Supabase Auth enforces rate limits on authentication endpoints to prevent abuse. Some rate limits are customizable, and you can configure them in your project [**Authentication** > **Rate Limits**](/dashboard/project/_/auth/rate-limits).

You can also manage rate limits using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Get current rate limits
curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq 'to_entries | map(select(.key | startswith("rate_limit_"))) | from_entries'

# Update rate limits
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rate_limit_anonymous_users": 10,
    "rate_limit_email_sent": 10,
    "rate_limit_sms_sent": 10,
    "rate_limit_verify": 10,
    "rate_limit_token_refresh": 10,
    "rate_limit_otp": 10,
    "rate_limit_web3": 10
  }'
```

## Rate limit behavior

Supabase Auth uses a token bucket algorithm for endpoint operations that are limited by IP address.

Each bucket has a maximum capacity of 30 requests. When the bucket is full, brief bursts of up to 30 requests can be allowed in a short period. Once the bucket empties, requests are rate limited until tokens refill. The rate limit defines the rate at which the bucket is refilled.

This means a client that has been idle will tolerate a brief spike in traffic, but sustained request above the rate limit are denied. When rate limits are exceeded, a **429 Too Many Requests** error is returned.

The table below shows the rate limit quotas and additional details for authentication endpoints.

<$Partial path="auth_rate_limits.mdx" />

## IP address forwarding

By default, Supabase Auth uses the IP address of the client for rate limiting. In certain cases, such as when using server-side frameworks or proxies in front of a project, it may be necessary to forward the end-user IP address to avoid being rate limited based on the address of the server-side client. To use a forwarded IP address for rate limiting in Supabase Auth, set the `Sb-Forwarded-For` header to the end-user IP address and make a request with a [secret API key](/docs/guides/getting-started/api-keys). Publishable API keys and legacy `anon`/`service_role` API keys are not supported.

IP address forwarding must be explicitly enabled for new projects. You can enable this feature in your project under the **IP Address Forwarding** section of your project's rate limit settings at [**Authentication** > **Rate Limits**](/dashboard/project/_/auth/rate-limits).

You can also enable IP address forwarding using the management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Update IP address forwarding settings
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
      "security_sb_forwarded_for_enabled": true
        }' \
    | jq '.security_sb_forwarded_for_enabled'
```

Once IP address forwarding is enabled, set the `Sb-Forwarded-For` header using the Supabase SDK:

```typescript
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  'https://<your-project-id>.supabase.co',
  '<your-secret-key>', // Key should start with sb_secret
  {
    global: {
      headers: {
        'sb-forwarded-for': request.headers.get('x-forwarded-for'),
      },
    },
  }
)
```
