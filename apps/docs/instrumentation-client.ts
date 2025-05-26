// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { IS_DEV } from './lib/constants'

if (!IS_DEV) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    ignoreErrors: [
      // [Charis 2025-05-05]
      // We should fix hydration problems but let's not make this a blocker for
      // now.
      /(?:text content does not match)|hydration|hydrating/i,
    ],

    beforeSend(event) {
      const frames = event.exception?.values?.[0].stacktrace?.frames || []

      // Drop errors not originating from docs app static files as unactionable
      if (
        frames &&
        !frames.some((frame) => frame.filename && frame.filename.startsWith('app:///_next'))
      ) {
        return null
      }

      return event
    },
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
