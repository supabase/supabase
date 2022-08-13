---
slug: /
sidebar_position: 1
sidebar_label: Supabase API
---

# Supabase API (Beta)

The Supabase API allows you to manage your projects programmatically.

## Status

The API is currently in beta. It may have breaking changes.

## Authentication

All API requests require an `Authorization Bearer token`.
To generate or manage your API key, visit your [account](https://app.supabase.com/account/tokens) page.
Your API key carries the same privileges as your user account, so be sure to keep it secret.

```bash
$ curl https://api.supabase.com/v1/projects \
-H "Authorization: Bearer sbp_bdd0••••••••••••••••••••••••••••••••4f23"
```

All API requests must be authenticated and made over HTTPS.

## Rate limits

The API is currently subject to our fair-use policy. In the future, are likely to introduce rate limits.
All resources created via the API are subject to the pricing detailed on our [Pricing](https://supabase.com/pricing) pages.
