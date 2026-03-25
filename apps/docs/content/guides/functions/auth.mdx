---
id: 'auth'
title: 'Securing Edge Functions'
description: 'Supabase Edge Functions and Auth.'
subtitle: 'Best practices on securing Edge Functions'
---

<Admonition type="note">

In the past Supabase Auth used a **symmetric** secret to sign legacy JWTs.
But it was replaced by new [JWT Signing Keys](/blog/jwt-signing-keys#start-using-asymmetric-jwts-today). This guide covers the new patterns for securing your Edge Functions.

If you need to validate using the old method, read the [Legacy JWT Secret guide](/docs/guides/functions/auth-legacy-jwt).

</Admonition>

Before continuing, read the [JWT Signing Keys guide](/docs/guides/auth/signing-keys) for details about the main differences compared to Legacy JWTs.

## Overview

When an HTTP request is sent to Edge Functions, you can use Supabase Auth to secure endpoints. In the past, this verification was controlled by the [`verify_jwt` flag](/docs/guides/functions/function-configuration#skipping-authorization-checks).

But, this method is incompatible with the new [JWT Signing Keys](/docs/guides/auth/signing-keys) and also caused trouble when attempting [third-party integration](https://github.com/orgs/supabase/discussions/34988#discussion-8199151).

For this reason we decided to no longer implicitly force JWT verification, but instead suggest patterns and templates to handle this task. This allows users to own and control the auth code, instead of hiding it internally under Edge Runtime infrastructure.

<Admonition type="caution">

Following the [upcoming API key changes](https://github.com/orgs/supabase/discussions/29260) timetable, the `verify_jwt` flag will still be supported and enabled by default. To move to the new [JWT Signing Keys](/docs/guides/auth/signing-keys), you need to manually [skip the authorization checks](/docs/guides/functions/function-configuration#skipping-authorization-checks) and follow the steps below.

</Admonition>

## Integrating with Supabase Auth

Important notes to consider:

- This is done _inside_ the `Deno.serve()` callback argument, so that the Authorization header is set for each request.
- Use `Deno.env.get('SUPABASE_URL')` to get the URL associated with your project. Using a value such as `http://localhost:54321` for local development will fail due to Docker containerization.

<$Partial path="api_settings.mdx" variables={{ "framework": "", "tab": "" }} />

<Admonition type="caution">

Currently, the new API keys are not available by default on the Edge Functions environment.
But you can manually expose them as [secret](/docs/guides/functions/secrets#local-secrets) using the `SB_` prefix.

We're working on exposing these secrets and making them default in the future.

</Admonition>

```ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SB_PUBLISHABLE_KEY')!)

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')

  const { data, error } = await supabase.auth.getClaims(token)
  const userEmail = data?.claims?.email
  if (!userEmail || error) {
    return Response.json(
      { msg: 'Invalid JWT' },
      {
        status: 401,
      }
    )
  }

  return Response.json({ message: `hello ${userEmail}` })
})
```

## Verifying JWT

### Using Supabase template

You can see [a custom JWT verification example on GitHub](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/custom-jwt-validation) and a variety of [auth function templates](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/_shared/jwt) also on GitHub.

To verify incoming requests, you can copy/download the specified template and start using it:

<Admonition type="tip">

The following example uses [`jose`](https://jsr.io/@panva/jose) library to verify received JWTs.

</Admonition>
{/* prettier-ignore */}
<$CodeSample
path="/edge-functions/supabase/functions/_shared/jwt/default.ts"
meta="name=_shared/jwt/default.ts"
lines={[[3, -1]]}
/>

<$CodeSample
path="/edge-functions/supabase/functions/custom-jwt-validation/index.ts"
meta="name=hello/index.ts"
lines={[[4, -1]]}
/>
