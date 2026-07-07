// Sentry client init for the TanStack Start (Vite) build.
//
// NOTE: deliberately not named `sentry.client.tanstack.ts` — TanStack Start's
// import-protection denies `**/*.client.*` modules in the server bundle, and
// this module is imported from router.tsx (shared between client and server).
// It is isomorphic by design: the `typeof window` guard below makes it a
// no-op on the server.
//
// The Next build initializes Sentry via instrumentation-client.ts — a Next
// convention file that nothing loads under TanStack Start. Without this init
// every `Sentry.captureException` in the TanStack runtime (including the
// globalErrorBoundary / routerErrorComponent captures in routes/__root.tsx)
// was a silent no-op.
//
// Called from `getRouter()` (router.tsx) — the earliest point in the TanStack
// client bootstrap with access to the router instance, which
// `tanstackRouterBrowserTracingIntegration` needs at init time so the
// pageload span is captured, not just later navigations.
//
// Imports `@sentry/react` directly (not `@sentry/nextjs`): this module never
// runs on the Next build, and the real `@sentry/nextjs` doesn't export the
// TanStack Router integration. Under Vite both ids resolve to the same
// `@sentry/react` instance anyway (vite.config.ts aliases `@sentry/nextjs`
// to compat/sentry-nextjs.ts), so app code capturing via `@sentry/nextjs`
// reports through the client initialized here.
import * as Sentry from '@sentry/react'
import type { AnyRouter } from '@tanstack/react-router'

import { buildSentryClientOptions } from '@/lib/sentry-client-options'

let initialized = false

export function initSentryTanStackClient(router: AnyRouter) {
  // Client-only: getRouter() also runs during SSR/prerender, and the TanStack
  // build has no server-side Sentry story yet (the Next build's
  // sentry.server.config.ts equivalent would live in a custom server entry).
  if (typeof window === 'undefined') return
  // getRouter() is called once per pageload today; keep the guard so a future
  // second call can't double-init the client.
  if (initialized) return
  initialized = true

  // No-ops cleanly when NEXT_PUBLIC_SENTRY_DSN is unset (local/self-hosted):
  // `init` without a dsn creates a disabled client, and beforeSend drops
  // everything when !IS_PLATFORM regardless.
  Sentry.init(
    buildSentryClientOptions({
      // The Vite build doesn't run a Sentry bundler plugin, so stack frames
      // carry no `supabase-studio` applicationKey metadata. Without the
      // metadata the integration would tag EVERY event third_party_code=true
      // and beforeSend would drop them all. Leave it off until the Vite build
      // annotates frames (@sentry/vite-plugin moduleMetadata).
      thirdPartyErrorFilter: false,
      extraIntegrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    })
  )
}
