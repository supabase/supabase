// Sentry client init for the TanStack Start (Vite) build.
//
// NOTE: deliberately not named `sentry.client.tanstack.ts` — TanStack Start's
// import-protection denies `**/*.client.*` modules in the server bundle, and
// this module is imported from router.tsx (shared between client and server).
// It is isomorphic by design: the `typeof window` guard below makes it a
// no-op on the server.
//
// Without this init every `Sentry.captureException` in the app (including the
// globalErrorBoundary / routerErrorComponent captures in routes/__root.tsx)
// would be a silent no-op.
//
// Called from `getRouter()` (router.tsx) — the earliest point in the TanStack
// client bootstrap with access to the router instance, which
// `tanstackRouterBrowserTracingIntegration` needs at init time so the
// pageload span is captured, not just later navigations.
//
// App code imports the same `@sentry/react` instance, so its captures report
// through the client initialized here.
import * as Sentry from '@sentry/react'
import type { AnyRouter } from '@tanstack/react-router'

import { buildSentryClientOptions } from '@/lib/sentry-client-options'

let isInitialized = false

export function initSentryTanStackClient(router: AnyRouter) {
  // Client-only: getRouter() also runs during SSR/prerender; the server is
  // initialized separately by instrument.server.mjs.
  if (typeof window === 'undefined') return
  // getRouter() is called once per pageload today; keep the guard so a future
  // second call can't double-init the client.
  if (isInitialized) return
  isInitialized = true

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
      includeThirdPartyErrorFilter: false,
      extraIntegrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router, {
          // Skip the per-asset resource-timing spans. The Vite/Rolldown build
          // ships ~250 separate immutable chunks on initial load, and the
          // browser tracing integration turns EVERY one of them into a child
          // span of the pageload transaction. Measured over 7 days in the
          // supabase-app Sentry project, this build emitted ~3,500x the
          // `resource.other` spans of the former Next build on comparable pageload
          // traffic, and `resource.*` was over half of all span volume in the
          // project. That burned the span budget, tripped Sentry's spike
          // protection, and made the pageload/throughput alerts fire (FE-4755).
          //
          // What this does NOT drop: `http.client` spans (the SDK excludes
          // `fetch`/`xmlhttprequest` initiators from resource spans and
          // instruments them separately), Web Vitals, navigation and pageload
          // timings. We only lose the per-asset waterfall.
          ignoreResourceSpans: ['resource.other', 'resource.link', 'resource.script'],
        }),
      ],
      // Without a release the SDK silently drops session envelopes
      // (`Client.sendSession` early-returns), so Release Health sends nothing
      // at all. Inline the Vercel commit SHA (vite.config.ts re-exposes
      // VERCEL_GIT_COMMIT_SHA under the NEXT_PUBLIC_ name).
      // Unset outside Vercel (local/self-hosted), where sessions don't matter —
      // so session envelopes only fire on deploys, not on a local dev build.
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    })
  )
}
