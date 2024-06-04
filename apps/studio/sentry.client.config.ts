import * as Sentry from '@sentry/nextjs'
import { IS_PLATFORM } from 'common/constants/environment'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { match } from 'path-to-regexp'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.01,
  debug: false,
  beforeSend(event) {
    const consent =
      typeof window !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
        : null

    if (IS_PLATFORM && consent === 'true') {
      return event
    }
    return null
  },
  integrations: [
    new Sentry.BrowserTracing({
      // TODO: update gotrue + api to support Access-Control-Request-Headers: authorization,baggage,sentry-trace,x-client-info
      // then remove these options
      traceFetch: false,
      traceXHR: false,
      beforeNavigate: (context) => {
        return {
          ...context,
          name: standardiseRouterUrl(location.pathname),
        }
      },
    }),
  ],
  ignoreErrors: [
    // Used exclusively in Monaco Editor.
    'ResizeObserver',
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
    // [Terry] When users paste in an embedded Github Gist
    // Error thrown by `sql-formatter` lexer when given invalid input
    // Original format: new Error(`Parse error: Unexpected "${text}" at line ${line} column ${col}`)
    /^Parse error: Unexpected ".+" at line \d+ column \d+$/,
  ],
})

// Replace dynamic query param with a template text
// Support grouping sentry transaction
function standardiseRouterUrl(url: string) {
  let finalUrl = url

  const orgMatch = match('/org/:slug/(.*)', { decode: decodeURIComponent })
  const orgMatchResult = orgMatch(finalUrl)
  if (orgMatchResult) {
    finalUrl = finalUrl.replace((orgMatchResult.params as any).slug, '[slug]')
  }

  const newOrgMatch = match('/new/:slug', { decode: decodeURIComponent })
  const newOrgMatchResult = newOrgMatch(finalUrl)
  if (newOrgMatchResult) {
    finalUrl = finalUrl.replace((newOrgMatchResult.params as any).slug, '[slug]')
  }

  const projectMatch = match('/project/:ref/(.*)', { decode: decodeURIComponent })
  const projectMatchResult = projectMatch(finalUrl)
  if (projectMatchResult) {
    finalUrl = finalUrl.replace((projectMatchResult.params as any).ref, '[ref]')
  }

  return finalUrl
}
