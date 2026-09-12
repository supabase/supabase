// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { hasConsented, IS_PLATFORM } from 'common'

import { IS_DEV } from './lib/constants'
import { filterSentryEvent } from './lib/sentry-client'

if (!IS_DEV) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    integrations: (defaultIntegrations) => [
      ...defaultIntegrations,
      Sentry.thirdPartyErrorFilterIntegration({
        filterKeys: ['supabase-docs'],
        behaviour: 'apply-tag-if-exclusively-contains-third-party-frames',
      }),
    ],

    ignoreErrors: [
      // [Charis 2025-05-05]
      // We should fix hydration problems but let's not make this a blocker for
      // now.
      /(?:text content does not match)|hydration|hydrating/i,
    ],

    beforeSend(event) {
      return filterSentryEvent(event, { isPlatform: IS_PLATFORM, hasConsent: hasConsented() })
    },
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
