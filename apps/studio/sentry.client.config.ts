// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { IS_PLATFORM } from 'common/constants/environment'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { match } from 'path-to-regexp'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.01,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend(event, hint) {
    const consent =
      typeof window !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
        : null

    if (IS_PLATFORM && consent === 'true') {
      // Ignore invalid URL events for 99% of the time because it's using up a lot of quota.
      const isInvalidUrlEvent = (hint.originalException as any)?.message?.includes(
        `Failed to construct 'URL': Invalid URL`
      )
      if (isInvalidUrlEvent && Math.random() > 0.01) {
        return null
      }
      return event
    }
    return null
  },

  integrations: [
    Sentry.browserTracingIntegration({
      // TODO: update gotrue + api to support Access-Control-Request-Headers: authorization,baggage,sentry-trace,x-client-info
      // then remove these options
      traceFetch: false,
      traceXHR: false,
      beforeStartSpan: (context) => {
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
    's.getModifierState is not a function',
    /^Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope'/,
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
    // [Joshen] IMO, should be caught on API if there's anything to handle - FE shouldn't dupe this alert
    /504 Gateway Time-out/,
    // [Joshen] This is the one caused by Google translate in the browser + 3rd party extensions
    'Node.insertBefore: Child to insert before is not a child of this node',
    // [Joshen] This one sprung up recently and I've no idea where this is coming from
    'r.default.setDefaultLevel is not a function',
    // [Joshen] Safe to ignore, it an error from the copyToClipboard
    'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.',
  ],
})

// Replace dynamic query param with a template text
// Support grouping sentry transaction
function standardiseRouterUrl(url: string) {
  let finalUrl = url

  const orgMatch = match('/org/:slug{/*path}', { decode: decodeURIComponent })
  const orgMatchResult = orgMatch(finalUrl)
  if (orgMatchResult) {
    finalUrl = finalUrl.replace((orgMatchResult.params as any).slug, '[slug]')
  }

  const newOrgMatch = match('/new/:slug', { decode: decodeURIComponent })
  const newOrgMatchResult = newOrgMatch(finalUrl)
  if (newOrgMatchResult) {
    finalUrl = finalUrl.replace((newOrgMatchResult.params as any).slug, '[slug]')
  }

  const projectMatch = match('/project/:ref{/*path}', { decode: decodeURIComponent })
  const projectMatchResult = projectMatch(finalUrl)
  if (projectMatchResult) {
    finalUrl = finalUrl.replace((projectMatchResult.params as any).ref, '[ref]')
  }

  return finalUrl
}
