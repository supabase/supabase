---
slug: /
sidebar_position: 1
sidebar_label: Supabase API
---

# Supabase API

The Supabase API allows you to manage your projects programmatically.

## Status

The Supabase API is in `beta`. It is usable in it's current state, but it's likely that there will be breaking changes.

## Authentication

All API requests require a Supabase Personal token to be included in the Authorization header: `Authorization Bearer <supabase_personal_token`.
To generate or manage your API token, visit your [account](https://app.supabase.com/account/tokens) page.
Your API tokens carry the same privileges as your user account, so be sure to keep it secret.

```bash
$ curl https://api.supabase.com/v1/projects \
-H "Authorization: Bearer sbp_bdd0••••••••••••••••••••••••••••••••4f23"
```

All API requests must be authenticated and made over HTTPS.

## Rate limits

The API is currently subject to our fair-use policy. In the future, are likely to introduce rate limits.
All resources created via the API are subject to the pricing detailed on our [Pricing](https://supabase.com/pricing) pages.

## Additional links

- [OpenAPI Docs](https://api.supabase.com/api/v1)
- [OpenAPI Spec](https://api.supabase.com/api/v1-json)
- Reporting bugs and issues: [github.com/supabase/supabase](https://github.com/supabase/supabase)
