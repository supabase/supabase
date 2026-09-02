---
id: function-configuration
title: Function Configuration
description: Learn how to configure your functions in Supabase.
subtitle: Configure individual function behavior. Customize authentication, dependencies, and other settings per function.
---

## Configuration

By default, all your Edge Functions have the same settings. In real applications, however, you might need different behaviors between functions.

For example:

- **Stripe webhooks** need to be publicly accessible (Stripe doesn't have your user tokens)
- **User profile APIs** should require authentication
- **Some functions** might need special dependencies or different file types

To enable these per-function rules, create `supabase/config.toml` in your project root:

```toml
# Disables authentication for the Stripe webhook.
[functions.stripe-webhook]
verify_jwt = false

# Custom dependencies for this specific function
[functions.image-processor]
import_map = './functions/image-processor/import_map.json'

# Custom entrypoint for legacy function using JavaScript
[functions.legacy-processor]
entrypoint = './functions/legacy-processor/index.js
```

This configuration tell Supabase that the `stripe-webhook` function doesn't require a valid JWT, the `image-processor` function uses a custom import map, and `legacy-processor` uses a custom entrypoint.

You set these rules once and never worry about them again. Deploy your functions knowing that the security and behavior is exactly what each endpoint needs.

<Admonition type="note">

To see more general `config.toml` options, check out [this guide](/docs/guides/local-development/managing-config).

</Admonition>

---

## Skipping authorization checks

By default, Edge Functions require a valid JWT in the authorization header. If you want to use Edge Functions without Authorization checks (commonly used for Stripe webhooks), you can configure this in your `config.toml`:

```toml
[functions.stripe-webhook]
verify_jwt = false
```

You can also pass the `--no-verify-jwt` flag when serving your Edge Functions locally:

```bash
supabase functions serve hello-world --no-verify-jwt
```

<Admonition type="caution">

Be careful when using this flag, as it will allow anyone to invoke your Edge Function without a valid JWT. The Supabase client libraries automatically handle authorization.

</Admonition>

---

## Custom entrypoints

<Admonition type="note">

`entrypoint` is available only in Supabase CLI version 1.215.0 or higher.

</Admonition>

When you create a new Edge Function, it will use TypeScript by default. However, it is possible to write and deploy Edge Functions using pure JavaScript.

Save your Function as a JavaScript file (e.g. `index.js`) update the `supabase/config.toml` :

```toml
[functions.hello-world]
entrypoint = './index.js' # path must be relative to config.toml
```

You can use any `.ts`, `.js`, `.tsx`, `.jsx` or `.mjs` file as the entrypoint for a Function.
