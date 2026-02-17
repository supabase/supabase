// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT && {
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }),
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable performance monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
  ignoreErrors: [
    // Used exclusively in Monaco Editor.
    'ResizeObserver',
    // [Joshen] We currently use stripe-js for customers to save their credit card data
    // I'm unable to reproduce this error on local, staging nor prod across chrome, safari or firefox
    // Based on https://github.com/stripe/stripe-js/issues/26, it seems like this error is safe to ignore,
    'Failed to load Stripe.js',
  ],
})
