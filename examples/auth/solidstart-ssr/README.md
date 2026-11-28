# SolidStart + Supabase SSR Auth Example

This example demonstrates how to use Supabase's SSR auth client with
[SolidStart](https://start.solidjs.com/). It mirrors the patterns used in
Supabase's [Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs),
[SvelteKit](https://supabase.com/docs/guides/auth/server-side/sveltekit), and
[Astro](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
guides, adapted for SolidStart's conventions.

## Why SolidStart is different

SolidStart does **not** have the same `NextRequest` / `NextResponse` API as
Next.js, nor SvelteKit's `event.cookies` object. The important differences
that affect Supabase SSR usage are:

1. **SolidStart middleware receives plain `Request` objects.** There is no
   built-in response wrapper with `cookies.set()`. Cookie writes must be
   done by appending `Set-Cookie` headers on the outgoing `Response`.

2. **There is no `"use server"` pragma.** Server-only code is marked with
   `createServerFn`, which Solid automatically tree-shakes from client
   bundles. This makes it safe to keep Supabase server client construction
   inside server functions.

3. **The global server context exposes the current `Request`.** SolidStart v1
   provides `globalThis.server.request` inside `server$` functions and loaders,
   which is where we read auth cookies.

## Project structure

```
src/
├── lib/
│   ├── supabase.ts     ← createServerClient / createBrowserClient helpers
│   └── session.ts      ← server$ function that validates the session
├── routes/
│   ├── layout.ts       ← Layout-level SSR loader: reads cookies, returns user
│   ├── layout.tsx      ← Root layout component (entry point)
│   ├── index.tsx       ← Home page, hydrates browser client on mount
├── entry-server.tsx    ← SolidStart server entry
├── entry-client.tsx    ← SolidStart client entry
└── env.d.ts            ← Environment variable types
```

## Getting started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Run the dev server
npm run dev
```

## Key patterns

### 1. Server client in server$ functions

The only safe place to create a Supabase **server** client is inside a
`createServerFn` handler or a server-only loader. These run on the server
and Solid tree-shakes them out of the client bundle.

```ts
// src/routes/layout.ts
export const layoutLoad = createServerFn({ method: 'GET' }).handler(async () => {
  const request = (globalThis as any).server?.request
  const cookieHeader = request?.headers?.get('Cookie') ?? ''

  const supabase = createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return parseCookieHeader(cookieHeader) },
      setAll() { /* no-op in server$ */ },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  return { user }
})
```

### 2. Browser client in components

On the client (after hydration), use `createBrowserClient`. This is safe
because the component code only runs in the browser.

```ts
import { createSupabaseBrowserClient } from '../lib/supabase'

onMount(async () => {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getUser()
  setUser(data.user)
})
```

### 3. Cookie persistence

`setAll` is a **no-op** inside `server$` functions — SolidStart does not
provide a response mutation hook there. For full session sync (e.g. token
refresh that updates cookies), you have two options:

- **Use a SolidStart middleware (`src/server.ts`)** to wrap responses and
  inject `Set-Cookie` headers. This example keeps it minimal by only
  demonstrating read-only session validation.
- **Use `supabase.auth.signInWithOtp({ email })` from the browser** for
  client-side auth flows — the SDK handles cookie writes automatically in
  that context.

## Related

- [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side)
- [@supabase/ssr on npm](https://www.npmjs.com/package/@supabase/ssr)
- [SolidStart docs](https://start.solidjs.com/)
