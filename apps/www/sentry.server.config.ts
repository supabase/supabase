// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Route events to different DNs
  transport: Sentry.makeMultiplexedTransport(Sentry.makeFetchTransport, ({ getEvent }) => {
    const event = getEvent();

    // Send to different DSNs, based on the project tag
    if (event?.tags?.project === "community" && process.env.SENTRY_DSN_COMMUNITY) {
      return [{
        dsn: process.env.SENTRY_DSN_COMMUNITY,
        // Release is mandatory. Using commit sha as recommended in:
        // https://docs.sentry.io/platforms/javascript/configuration/releases/
        release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown"
      }];
    }

    return [];
  }),
})
