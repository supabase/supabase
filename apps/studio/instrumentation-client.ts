// This file configures the initialization of Sentry on the client for the
// NEXT build — Next auto-loads it whenever a user loads a page in their
// browser. The TanStack Start (Vite) build never loads Next convention files;
// it initializes Sentry with the same shared options in
// sentry.tanstack.ts instead.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

import { buildSentryClientOptions } from '@/lib/sentry-client-options'

Sentry.init(
  buildSentryClientOptions({
    // next.config.ts (withSentryConfig) annotates the bundles with the
    // 'supabase-studio' applicationKey, so third-party frame tagging works
    // on this build.
    includeThirdPartyErrorFilter: true,
  })
)

// This export will instrument router navigations, and is only relevant if you enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
