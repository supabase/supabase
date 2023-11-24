import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.01,
  debug: false,
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
