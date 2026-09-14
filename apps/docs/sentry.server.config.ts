// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

import { IS_DEV } from './lib/constants'

if (!IS_DEV) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    ignoreErrors: [
      // A missing MDX file is a 404, not an error. Requests for guide paths
      // that don't exist are ordinary crawler and inbound-link traffic.
      /^FileNotFound:/,
    ],
  })
}
