// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { match } from 'path-to-regexp'
import { Integrations } from '@sentry/tracing'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.01,
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  integrations: [
    new Integrations.BrowserTracing({
      beforeNavigate: (context) => {
        return {
          ...context,
          name: standardiseRouterUrl(location.pathname),
        }
      },
    }),
  ],
  ignoreErrors: [
    'ResizeObserver',
    'Non-Error exception captured',
    'Non-Error promise rejection',
    '[object Event]',
    // [Joshen] We currently use stripe-js for customers to save their credit card data
    // I'm unable to reproduce this error on local, staging nor prod across chrome, safari or firefox
    // Based on https://github.com/stripe/stripe-js/issues/26, it seems like this error is safe to ignore,
    'Failed to load Stripe.js',
    // [Joshen] This is a chrome specific error, fix is out in chromium, pending chrome update
    // Ref: https://stackoverflow.com/questions/72437786/chrome-evalerror-possible-side-effect-in-debug
    'Possible side-effect in debug-evaluate',
    // [Joshen] This event started occurring after our fix in the org dropdown by reading the slug from
    // the URL params instead of the store, but we cannot repro locally, staging nor on prod
    // Safe to ignore since it's not a user-facing issue + we've not received any user feedback/report about it
    // Ref: https://github.com/supabase/supabase/pull/9729
    'The provided `href` (/org/[slug]/general) value is missing query values (slug)',
  ],
  beforeSend: (event) => filterConsoleErrors(event),
})

// Replace dynamic query param with a template text
// Support grouping sentry transaction
function standardiseRouterUrl(url) {
  let finalUrl = url

  const orgMatch = match('/org/:slug/(.*)', { decode: decodeURIComponent })
  const orgMatchResult = orgMatch(finalUrl)
  if (orgMatchResult) {
    finalUrl = finalUrl.replace(orgMatchResult.params.slug, '[slug]')
  }

  const newOrgMatch = match('/new/:slug', { decode: decodeURIComponent })
  const newOrgMatchResult = newOrgMatch(finalUrl)
  if (newOrgMatchResult) {
    finalUrl = finalUrl.replace(newOrgMatchResult.params.slug, '[slug]')
  }

  const projectMatch = match('/project/:ref/(.*)', { decode: decodeURIComponent })
  const projectMatchResult = projectMatch(finalUrl)
  if (projectMatchResult) {
    finalUrl = finalUrl.replace(projectMatchResult.params.ref, '[ref]')
  }

  return finalUrl
}

// Ignore dev console errors getting incorrectly thrown to sentry (Chrome specific)
// https://github.com/getsentry/sentry-javascript/issues/5179#issuecomment-1206343862
function filterConsoleErrors(event) {
  const originalException = event.exception?.values?.[0]

  // Console errors appear to always bubble up to `window.onerror` and to be unhandled. So if,
  // we don't have the original exception or the mechanism looks different, we can early return the event.
  // (Note, this might change depending on the used framework, so feel free to remove this check.)
  if (
    !originalException ||
    !originalException.mechanism ||
    originalException.mechanism.type !== 'onerror' ||
    originalException.mechanism.handled
  ) {
    return event
  }

  const stackFrames = originalException.stacktrace?.frames
  const errorType = originalException.type?.toLowerCase()

  // If we don't have any information on error type or stacktrace, we have no information about the error
  // this is unlikely to happen but it doesn't appear to happen in console errors.
  // Hence, we can early return here as well.
  if (!stackFrames || !errorType) {
    return event
  }

  // For simple console errors (e.g. users just typing a statement they want evaluated)
  // the stacktrace will only have one frame.
  // This condition will not catch errors that would be thrown if users type in multi-line
  // statements. For example, if they define a multi-line function.
  // You can try experimenting with this number but there's little guarantee that the other
  // conditions will work. Nevertheless, the checks below also work with multi-frame stacktraces.
  const hasShortStackTrace = stackFrames.length <= 2
  if (hasShortStackTrace && isSuspiciousError(errorType) && hasSuspiciousFrames(stackFrames)) {
    console.warn('Dropping error due to suspicious stack frames.')
    return null
  }

  return event
}

function isSuspiciousError(errorType) {
  return ['syntaxerror', 'referenceerror', 'typeerror'].includes(errorType)
}

function hasSuspiciousFrames(stackFrames) {
  const allSuspicious = stackFrames.every(isSuspiciousFrame)

  // Certain type errors will include the thrown error message as the second stack frame,
  // but the first will still follow the suspicious pattern.
  const firstSuspicious = stackFrames.length === 2 && isSuspiciousFrame(stackFrames[0])

  return allSuspicious || firstSuspicious
}

function isSuspiciousFrame(frame) {
  const url = window.location.href
  return frame.function === '?' && (frame.filename === '<anonymous>' || frame.filename === url)
}
