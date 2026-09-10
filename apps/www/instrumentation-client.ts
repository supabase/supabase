import * as Sentry from '@sentry/nextjs'
import { hasConsented } from 'common/consent-state'
import { IS_PLATFORM } from 'common/constants/environment'

import { filterSentryEvent } from './lib/sentry-client'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: false,
  integrations: (defaultIntegrations) => [
    ...defaultIntegrations,
    Sentry.thirdPartyErrorFilterIntegration({
      filterKeys: ['supabase-www'],
      behaviour: 'apply-tag-if-exclusively-contains-third-party-frames',
    }),
  ],
  beforeSend(event) {
    return filterSentryEvent(event, { isPlatform: IS_PLATFORM, hasConsent: hasConsented() })
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
