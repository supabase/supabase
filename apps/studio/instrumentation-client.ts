// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { hasConsented } from 'common'
import { IS_PLATFORM } from 'common/constants/environment'
import { MIRRORED_BREADCRUMBS } from 'lib/breadcrumbs'
import { sanitizeArrayOfObjects, sanitizeUrlHashParams } from 'lib/sanitize'

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

// We want to ignore errors not originating from docs app static files
// (such as errors from browser extensions). Those errors come from files
// not starting with 'app:///_next'.
//
// However, there is a complication because the Sentry code that sends
// the error shows up in the stack trace, and that _does_ start with
// 'app:///_next'. It is always the first frame in the stack trace,
// and has a specific pre_context comment that we can use for filtering.
// Copied from docs app instrumentation-client.ts
function isThirdPartyError(frames: Sentry.StackFrame[] | undefined) {
  if (!frames || frames.length === 0) return false

  function isSentryFrame(frame: Sentry.StackFrame, index: number) {
    return index === 0 && frame.pre_context?.some((line) => line.includes('sentry.javascript'))
  }

  // Check if any frame is from our app (excluding Sentry's own frame)
  const hasAppFrame = frames.some((frame, index) => {
    const path = frame.abs_path || frame.filename
    return path?.startsWith('app:///_next') && !isSentryFrame(frame, index)
  })

  // If no app frames found, it's a third-party error
  return !hasAppFrame
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

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT && {
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }),
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable performance monitoring - Next.js routes and API calls are automatically instrumented
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

  // [Ali] Filter out browser extensions and user scripts (FE-2094)
  // Using denyUrls to block known third-party script patterns
  denyUrls: [/userscript/i],
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

    // Ignore invalid URL events for 99% of the time because it's using up a lot of quota.
    const isInvalidUrlEvent = (hint.originalException as any)?.message?.includes(
      `Failed to construct 'URL': Invalid URL`
    )
    // [Joshen] Similar behaviour for this error from SessionTimeoutModal to control the quota usage
    const isSessionTimeoutEvent = (hint.originalException as any)?.message?.includes(
      'Session error detected'
    )

    if ((isInvalidUrlEvent || isSessionTimeoutEvent) && Math.random() > 0.01) {
      return null
    }

    if (isHCaptchaRelatedError(event)) {
      return null
    }

    const frames = event.exception?.values?.[0].stacktrace?.frames || []
    if (isThirdPartyError(frames)) {
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
    // Used exclusively in Monaco Editor.
    'ResizeObserver',
    's.getModifierState is not a function',
    /^Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope'/,
    // Browser wallet extension errors (e.g., Gate.io wallet)
    'shouldSetTallyForCurrentProvider is not a function',
    // [Joshen] We currently use stripe-js for customers to save their credit card data
    // I'm unable to reproduce this error on local, staging nor prod across chrome, safari or firefox
    // Based on https://github.com/stripe/stripe-js/issues/26, it seems like this error is safe to ignore,
    'Failed to load Stripe.js',
    // [Joshen] This event started occurring after our fix in the org dropdown by reading the slug from
    // the URL params instead of the store, but we cannot repro locally, staging nor on prod
    // Safe to ignore since it's not a user-facing issue + we've not received any user feedback/report about it
    // Ref: https://github.com/supabase/supabase/pull/9729
    'The provided `href` (/org/[slug]/general) value is missing query values (slug)',
    'The provided `href` (/org/[slug]/team) value is missing query values (slug)',
    'The provided `href` (/org/[slug]/billing) value is missing query values (slug)',
    'The provided `href` (/org/[slug]/invoices) value is missing query values (slug)',
    // [Joshen] Seems to be from hcaptcha
    "undefined is not an object (evaluating 'n.chat.setReady')",
    "undefined is not an object (evaluating 'i.chat.setReady')",
    // [Terry] When users paste in an embedded GitHub Gist
    // Error thrown by `sql-formatter` lexer when given invalid input
    // Original format: new Error(`Parse error: Unexpected "${text}" at line ${line} column ${col}`)
    /^Parse error: Unexpected ".+" at line \d+ column \d+$/,
    // [Joshen] IMO, should be caught on API if there's anything to handle - FE shouldn't dupe this alert
    /504 Gateway Time-out/,
    // [Joshen] This is the one caused by Google translate in the browser + 3rd party extensions
    'Node.insertBefore: Child to insert before is not a child of this node',
    // [Ali] Google Translate / browser extension DOM manipulation errors
    'NotFoundError: The object can not be found here.',
    // [Joshen] This one sprung up recently and I've no idea where this is coming from
    'r.default.setDefaultLevel is not a function',
    // [Joshen] Safe to ignore, it an error from the copyToClipboard
    'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.',
  ],
})

// This export will instrument router navigations, and is only relevant if you enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
