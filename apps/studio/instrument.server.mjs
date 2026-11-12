// Server-side Sentry init for the TanStack Start runtime. Mirrors
// sentry.server.config.ts (Next) with the `@sentry/tanstackstart-react` SDK.
// server.ts imports it first so it runs before the route tree evaluates.
//
// Reads process.env at call time (NEXT_PUBLIC_* are inlined at build time
// instead), so env files must be loaded before the server boots self-hosted.

import * as Sentry from '@sentry/tanstackstart-react'

import { buildSentryServerOptions } from './lib/sentry-server-options'

// Tie server events to the deploy for source-map resolution.
Sentry.init(buildSentryServerOptions({ release: process.env.VERCEL_GIT_COMMIT_SHA }))
