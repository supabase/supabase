---
id: 'auth-headers'
title: 'Authorization headers'
description: 'How the Authorization and apikey request headers and the verify_jwt platform check work for Edge Functions.'
subtitle: 'How the Authorization and apikey headers and the verify_jwt platform check work'
---

Every request to an Edge Function passes through two layers of auth. First, a platform-level check (`verify_jwt`) runs before your code executes. Then, once the request reaches your handler, you decide what to do with the credentials the caller sent. This page is the reference for both layers. For the practical patterns built on top of them, see [Securing Edge Functions](/guides/functions/auth).

## Understanding authorization headers

Edge Functions care about two request headers. Sending the wrong credential in the wrong header is the most common source of 401 errors.

| Header          | Value                                   | Used for                               |
| --------------- | --------------------------------------- | -------------------------------------- |
| `Authorization` | `Bearer <user-jwt>`                     | A user signed in through Supabase Auth |
| `apikey`        | `sb_publishable_...` or `sb_secret_...` | Calls from clients or services         |

A common mistake is sending a publishable or secret key as a bearer token: `Authorization: Bearer sb_publishable_...`. The new API keys are not JWTs. The platform check can't validate them, and your handler can't verify them as JWTs either. Instead, put API keys in the `apikey` header.

You can send both headers together. A signed-in user calling your function through `supabase-js`, for example, sends their session JWT in `Authorization` and the project's publishable key in `apikey`.

## The `verify_jwt` platform check

When `verify_jwt` is enabled (the default), the platform inspects the `Authorization` header of every request before your function runs. It expects a valid user JWT. If the header is missing, malformed, or signed with a different key, the platform returns a 401 error, and your code never executes.

The check validates legacy HS256 JWTs and JWTs signed with the new asymmetric [signing keys](/docs/guides/auth/signing-keys).

The check does not accept an API key. Publishable and secret keys are not JWTs, so callers that send one in the `Authorization` header fail the check before their request reaches your handler.

Use the `verify_jwt` flag to match how the function is called:

- **Leave `verify_jwt` on** for functions that are only called with a user JWT, such as functions invoked from the client through `supabase.functions.invoke`. The platform rejects unauthenticated requests before they reach your code, and your handler can trust that a valid JWT is present.
- **Turn `verify_jwt` off** for functions that are called without an `Authorization` header, such as webhooks from external providers, or service-to-service calls that authenticate with an API key. These patterns are covered in [Securing Edge Functions](/guides/functions/auth).

Set the flag per function in `supabase/config.toml`:

```toml
[functions.stripe-webhook]
verify_jwt = false
```

For 401 failure modes and how to diagnose them, see [Edge Function 401 error response](/docs/guides/troubleshooting/edge-function-401-error-response).
