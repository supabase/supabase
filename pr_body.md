Closes #41637

## Summary

Adds a SolidStart SSR example with the Supabase SSR auth client at `examples/auth/solidstart-ssr/`, alongside the existing Next.js, SvelteKit, Astro, and Hono examples.

## What makes SolidStart different

SolidStart does not have Next.js's `NextRequest`/`NextResponse` API or SvelteKit's `event.cookies`. The example demonstrates the correct patterns for this framework:

- **Server client creation inside `server$` functions** — SolidStart's `createServerFn` keeps server-only code tree-shakable, preventing accidental leaks into client bundles.
- **Reading cookies via the global server context** (`globalThis.server.request`) rather than a framework-specific wrapper.
- **Separation of server loader (`src/routes/layout.ts`) and component** (`src/routes/index.tsx`) — the loader validates the session with a server client; the component hydrates a browser client for client-side flows.
- **No `"use server"` pragma** — SolidStart uses explicit `createServerFn` markers, avoiding the misuse issue mentioned in the ticket.

## Files added

```
examples/auth/solidstart-ssr/
├── README.md              ← Explains SolidStart + Supabase patterns
├── package.json           ← Dependencies (@supabase/ssr, @solidjs/start)
├── vite.config.ts
├── .env.example
├── .gitignore
└── src/
    ├── entry-server.tsx
    ├── entry-client.tsx
    ├── env.d.ts
    ├── lib/
    │   ├── supabase.ts    ← createServerClient / createBrowserClient helpers
    │   └── session.ts     ← server$ function for protected data loading
    ├── routes/
    │   ├── layout.ts      ← Layout-level SSR loader (session validation)
    │   ├── index.tsx      ← Home page with sign-in/sign-out demo
    │   └── routes.tsx     ← Root layout
```

## Notes

- `setAll` is intentionally a no-op inside `server$` functions because SolidStart does not automatically persist cookie writes from server functions. The example documents this limitation and points to the middleware pattern (`src/server.ts`) for cases where full session sync (token refresh → Set-Cookie) is needed.
- This is a **minimal example** focused on SSR auth patterns — no build system wiring, no database schema, no full auth flow. It mirrors the scope of the existing lightweight SvelteKit example.
