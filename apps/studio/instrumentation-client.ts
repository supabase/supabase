// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { hasConsented } from 'common'
import { IS_PLATFORM } from 'common/constants/environment'
import { MIRRORED_BREADCRUMBS } from 'lib/breadcrumbs'
import { sanitizeArrayOfObjects, sanitizeUrlHashParams } from 'lib/sanitize'

const DEFAULT_ERROR_SAMPLE_RATE = 1.0
const LOW_PRIORITY_ERROR_SAMPLE_RATE = 0.01
const CHUNK_LOAD_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\d]+ failed/i,
  /Loading CSS chunk [\d]+ failed/i,
]

// This is a workaround to ignore hCaptcha related errors.
function isHCaptchaRelatedError(event: Sentry.Event): boolean {
  const errors = event.exception?.values ?? []
  for (const error of errors) {
    if (
      error.value?.includes('is not a function') &&
      error.stacktrace?.frames?.some((f) => f.filename === 'api.js')
    ) {
      return true
    }
  }
  return false
}

// Filter browser wallet extension errors (e.g., Gate.io wallet)
// These errors come from injected wallet scripts and are not actionable
// Examples: SUPABASE-APP-AFC, SUPABASE-APP-92A
export function isBrowserWalletExtensionError(event: Sentry.Event): boolean {
  const frames = event.exception?.values?.flatMap((e) => e.stacktrace?.frames || []) || []
  return frames.some((frame) => {
    const filename = frame.filename || frame.abs_path || ''
    return filename.includes('gt-window-provider') || filename.includes('wallet-provider')
  })
}

// Filter user-aborted operations (intentional cancellations)
// These are expected when users cancel requests or navigate away
// Examples: SUPABASE-APP-BG6, SUPABASE-APP-BG7
export function isUserAbortedOperation(error: unknown, event: Sentry.Event): boolean {
  const errorMessage = error instanceof Error ? error.message : ''
  const eventMessage = event.message || ''
  const message = errorMessage || eventMessage

  return (
    message.includes('operation was aborted') ||
    message.includes('signal is aborted') ||
    message.includes('manually canceled') ||
    message.includes('AbortError')
  )
}

// Filter cancellation promise rejections (e.g., from query cancellation)
// These occur when operations are intentionally cancelled by the user
// Example: SUPABASE-APP-353 (~466k events)
export function isCancellationRejection(event: Sentry.Event): boolean {
  const serialized = event.extra?.__serialized__ as Record<string, unknown> | undefined
  return serialized?.type === 'cancelation'
}

// Filter challenge/captcha expired errors (user timeout)
// These happen when users don't complete captcha in time - expected behavior
// Example: SUPABASE-APP-ACC
export function isChallengeExpiredError(error: unknown, event: Sentry.Event): boolean {
  const errorMessage = error instanceof Error ? error.message : ''
  const eventMessage = event.message || ''
  const message = errorMessage || eventMessage

  return message.includes('challenge-expired')
}

function isChunkLoadError(error: unknown, event: Sentry.Event): boolean {
  const errorMessage = error instanceof Error ? error.message : ''
  const eventMessage = event.message || ''
  const exceptionMessages = event.exception?.values?.map((ex) => ex.value ?? '') ?? []
  const combinedMessages = [errorMessage, eventMessage, ...exceptionMessages].filter(Boolean)

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) =>
    combinedMessages.some((message) => pattern.test(message))
  )
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT && {
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }),
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable performance monitoring
  tracesSampleRate: 0.001, // Capture 0.1% of transactions for performance monitoring

  integrations: (() => {
    const thirdPartyErrorFilterIntegration = (Sentry as any).thirdPartyErrorFilterIntegration
    if (!thirdPartyErrorFilterIntegration) return []

    // Drop errors whose stack trace only contains third-party frames (browser extensions,
    // injected scripts, etc.). This uses build-time code annotation via the applicationKey
    // in next.config.js to reliably distinguish our code from third-party code.
    return [
      thirdPartyErrorFilterIntegration({
        filterKeys: ['supabase-studio'],
        behaviour: 'drop-error-if-exclusively-contains-third-party-frames',
      }),
    ]
  })(),

  // Only capture errors originating from our own code.
  // This is a whitelist on the source URL in stack frames — it drops errors from
  // browser extensions, injected scripts, third-party widgets, etc. (FE-2094)
  allowUrls: [
    /https?:\/\/(.*\.)?supabase\.(com|co|green|io)/,
    /app:\/\//, // Next.js rewrites source URLs to app:// with source maps
  ],
  beforeBreadcrumb(breadcrumb, _hint) {
    const cleanedBreadcrumb = { ...breadcrumb }

    if (cleanedBreadcrumb.category === 'navigation') {
      if (typeof cleanedBreadcrumb.data?.from === 'string') {
        cleanedBreadcrumb.data.from = sanitizeUrlHashParams(cleanedBreadcrumb.data.from)
      }
      if (typeof cleanedBreadcrumb.data?.to === 'string') {
        cleanedBreadcrumb.data.to = sanitizeUrlHashParams(cleanedBreadcrumb.data.to)
      }
    }

    MIRRORED_BREADCRUMBS.pushBack(cleanedBreadcrumb)
    return cleanedBreadcrumb
  },
  beforeSend(event, hint) {
    const consent = hasConsented()

    if (!consent) {
      return null
    }

    if (!IS_PLATFORM) {
      return null
    }

    // Downsample only known high-noise classes; keep all other errors at full rate.
    const isInvalidUrlEvent = (hint.originalException as any)?.message?.includes(
      `Failed to construct 'URL': Invalid URL`
    )
    const isSessionTimeoutEvent = (hint.originalException as any)?.message?.includes(
      'Session error detected'
    )
    const isChunkLoadFailure = isChunkLoadError(hint.originalException, event)

    const codeSampleRate =
      isInvalidUrlEvent || isSessionTimeoutEvent || isChunkLoadFailure
        ? LOW_PRIORITY_ERROR_SAMPLE_RATE
        : DEFAULT_ERROR_SAMPLE_RATE

    if (Math.random() > codeSampleRate) {
      return null
    }

    event.tags = {
      ...event.tags,
      codeSampleRate: codeSampleRate.toString(),
    }

    if (isHCaptchaRelatedError(event)) {
      return null
    }

    // Drop events where every exception has no stack trace — these are not debuggable
    const exceptions = event.exception?.values ?? []
    if (exceptions.length > 0 && exceptions.every((ex) => !ex.stacktrace?.frames?.length)) {
      return null
    }

    // Filter out errors like 'e._5BLbSXV[t] is not a function' or anything matching '[t] is not a function'
    if (
      hint.originalException instanceof Error &&
      hint.originalException.message.includes('[t] is not a function')
    ) {
      return null
    }

    if (isBrowserWalletExtensionError(event)) {
      return null
    }
    if (isUserAbortedOperation(hint.originalException, event)) {
      return null
    }
    if (isCancellationRejection(event)) {
      return null
    }
    if (isChallengeExpiredError(hint.originalException, event)) {
      return null
    }

    if (event.breadcrumbs) {
      event.breadcrumbs = sanitizeArrayOfObjects(event.breadcrumbs) as Sentry.Breadcrumb[]
    }
    return event
  },
  ignoreErrors: [
    // === Monaco Editor ===
    'ResizeObserver',
    's.getModifierState is not a function',
    /^Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope'/,

    // === Browser extension errors ===
    // Gate.io wallet
    'shouldSetTallyForCurrentProvider is not a function',
    // SAP browser extensions (SAP GUI, SAP Companion)
    'sap is not defined',
    // Non-Error objects thrown as exceptions (e.g., Event objects)
    '[object Event]',

    // === Third-party SDK errors ===
    // stripe-js: https://github.com/stripe/stripe-js/issues/26
    'Failed to load Stripe.js',
    // hCaptcha
    "undefined is not an object (evaluating 'n.chat.setReady')",
    "undefined is not an object (evaluating 'i.chat.setReady')",

    // === Next.js internals ===
    // Ref: https://github.com/supabase/supabase/pull/9729
    /The provided `href` \(\/org\/\[slug\]\/.*\) value is missing query values/,
    // Next.js throws these during navigation, not actual errors
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',

    // === User input errors (not bugs) ===
    // sql-formatter lexer on invalid SQL input
    /^Parse error: Unexpected ".+" at line \d+ column \d+$/,

    // === Network / infrastructure (not actionable on FE) ===
    /504 Gateway Time-out/,
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'AbortError',
    'TypeError: cancelled',
    'TypeError: Cancelled',

    // === Browser extensions & Google Translate DOM manipulation ===
    'Node.insertBefore: Child to insert before is not a child of this node',
    "NotFoundError: Failed to execute 'removeChild' on 'Node'",
    "NotFoundError: Failed to execute 'insertBefore' on 'Node'",
    'NotFoundError: The object can not be found here.',
    "Cannot read properties of null (reading 'parentNode')",
    "Cannot read properties of null (reading 'removeChild')",
    "TypeError: can't access dead object",
    /^NS_ERROR_/,

    // === Non-Error throws (extensions, third-party libs throwing strings/objects) ===
    'Non-Error exception captured',
    'Non-Error promise rejection captured',

    // === Cross-origin script errors (no useful info) ===
    'Script error.',
    'Script error',

    // === React hydration mismatches caused by extensions modifying DOM ===
    // Note: we only suppress the generic browser messages, NOT "Hydration failed because..."
    // which can indicate real SSR/client mismatches in our own code.
    /text content does not match/i,
    /There was an error while hydrating/i,

    // === Web crawler / bot errors ===
    'instantSearchSDKJSBridgeClearHighlight',

    // === Misc known noise ===
    'r.default.setDefaultLevel is not a function',
    // Clipboard permission denied
    'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.',
    // Facebook pixel
    'fb_xd_fragment',
  ],
})

// This export will instrument router navigations, and is only relevant if you enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
