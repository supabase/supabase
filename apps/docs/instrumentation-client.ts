// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { hasConsented, IS_PLATFORM } from 'common'
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
      if (!IS_PLATFORM || !hasConsented()) {
        return null
      }

      const frames = event.exception?.values?.[0].stacktrace?.frames || []
      if (isThirdPartyError(frames)) {
        return null
      }

      return event
    },
  })
}

// We want to ignore errors not originating from docs app static files
// (such as errors from browser extensions). Those errors come from files
// not starting with 'app:///_next'.
//
// However, there is a complication because the Sentry code that sends
// the error shows up in the stack trace, and that _does_ start with
// 'app:///_next'. It is always the first frame in the stack trace,
// and has a specific pre_context comment that we can use for filtering.
function isThirdPartyError(frames: Sentry.StackFrame[] | undefined) {
  if (!frames) return false

  function isSentryFrame(frame: Sentry.StackFrame, index: number) {
    return index === 0 && frame.pre_context?.[0]?.includes('sentry.javascript')
  }

  return !frames.some((frame, index) => {
    frame.abs_path?.startsWith('app:///_next') && !isSentryFrame(frame, index)
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
