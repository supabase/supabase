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
    // [Joshen] We currently use stripe-js for customers to save their credit card data
    // I'm unable to reproduce this error on local, staging nor prod across chrome, safari or firefox
    // Based on https://github.com/stripe/stripe-js/issues/26, it seems like this error is safe to ignore,
    'Failed to load Stripe.js',
    // [Joshen] This is a chrome specific error, fix is out in chromium, pending chrome update
    // Ref: https://stackoverflow.com/questions/72437786/chrome-evalerror-possible-side-effect-in-debug
    'Possible side-effect in debug-evaluate',
  ],
})

// replace dynamic query param with a template text
// support grouping sentry transaction
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
