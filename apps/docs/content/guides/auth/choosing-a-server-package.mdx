---
title: 'Which package to use'
subtitle: 'When to use supabase-js, @supabase/ssr, or @supabase/server on the server.'
---

When you use Supabase from JavaScript on the server, there are three packages to choose from. They are not alternatives to each other — `@supabase/ssr` and `@supabase/server` both build on top of `supabase-js` and solve different problems. This guide helps you pick the right one.

<Admonition type="note">

These are JavaScript packages, not separate language SDKs. If you're looking for the client library for another language (Python, Swift, Kotlin, etc.), see the [client library references](/docs/reference).

</Admonition>

## Which package to use

The quickest way to decide is by **how the user's identity reaches your code**:

- The session lives in **cookies** (an SSR framework like Next.js or SvelteKit) → use **`@supabase/ssr`**.
- Auth arrives **per request in headers** (`Authorization: Bearer <jwt>`) → use **`@supabase/server`**.
- You want the base client, or you're handling auth yourself → use **`@supabase/supabase-js`** directly.

| Package                 | Use it when                                           | Runs in                                                                             | Auth model                                         |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| `@supabase/supabase-js` | You want the base client, or you manage auth yourself | Browser and server                                                                  | You wire up auth                                   |
| `@supabase/ssr`         | User sessions are stored in **cookies**               | SSR frameworks (Next.js, SvelteKit, TanStack Start)                                 | Cookie-based sessions, with refresh-token rotation |
| `@supabase/server`      | Auth arrives **per request in headers**               | Edge Functions, Workers, Vercel, Bun, and framework APIs (Hono, H3, Elysia, NestJS) | Stateless Bearer JWT + `apikey`                    |

## `@supabase/supabase-js`

The isomorphic base client. `@supabase/ssr` and `@supabase/server` both wrap it — reach for `supabase-js` directly when you don't need either wrapper's auth handling.

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!)
```

## `@supabase/ssr`

For SSR frameworks that store the user's session in cookies. It reads and writes session cookies and handles refresh-token rotation, so the same user and session are available on both the client and the server.

```ts
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      getAll() {
        // return the request's cookies
      },
      setAll(cookiesToSet) {
        // write cookies back on the response
      },
    },
  }
)
```

See the [server-side rendering guide](/guides/auth/server-side) for framework-specific setup.

## `@supabase/server`

For stateless, header-based auth in backend runtimes — Edge Functions, Workers, and framework APIs. You declare who may call an endpoint and receive a ready-to-use context (a caller-scoped client that respects RLS, plus an admin client). It verifies JWTs and resolves the new API keys (`SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS`) for you.

```ts
import { withSupabase } from '@supabase/server'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    // ctx.supabase is scoped to the caller and respects RLS
    const { data } = await ctx.supabase.from('todos').select()
    return Response.json(data)
  }),
}
```

See the [`@supabase/server` reference](/docs/reference/server) for the full API.

<Admonition type="note">

`@supabase/ssr` and `@supabase/server` coexist and are not replacements for each other, and `@supabase/ssr` is not deprecated. Pick based on where your code runs and how auth reaches it, using the table above.

</Admonition>

## Advanced: Combining `@supabase/server` and `@supabase/ssr`

In a cookie-based framework you can compose the two — let `@supabase/ssr` own the cookie session lifecycle and hand the resolved token to `@supabase/server`'s primitives. This requires more setup, and deeper first-party integration is on the roadmap. See the [`@supabase/server` SSR frameworks guide](https://github.com/supabase/server/blob/main/docs/ssr-frameworks.md).

## Next steps

- [Server-side rendering](/guides/auth/server-side) — set up `@supabase/ssr` for your framework.
- [`@supabase/server` reference](/docs/reference/server) — API for header-based server auth.
- [`supabase-js` reference](/docs/reference/javascript) — the base JavaScript client.
