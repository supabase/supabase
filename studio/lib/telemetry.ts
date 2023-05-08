import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { User } from 'types'
import { BrowserTabTracker } from 'browser-session-tabs'
import { NextRouter } from 'next/router'

export interface GoogleAnalyticsProps {
  screenResolution?: string
  language: string
}

const sendEvent = (
  event: {
    category: string
    action: string
    label: string
    value?: string
  },
  gaProps: GoogleAnalyticsProps,
  router: NextRouter
) => {
  if (!IS_PLATFORM) return

  const { category, action, label, value } = event

  return post(`${API_URL}/telemetry/event`, {
    action: action,
    category: category,
    label: label,
    value: value,
    page_referrer: document?.referrer,
    page_title: document?.title,
    page_location: router.asPath,
    ga: {
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
      session_id: BrowserTabTracker.sessionId,
    },
  })
}

/**
 * TODO: GA4 doesn't have identify method.
 * We may or may not need gaClientId here. Confirm later
 */
const sendIdentify = (user: User, gaProps?: GoogleAnalyticsProps) => {
  if (!IS_PLATFORM) return

  return post(`${API_URL}/telemetry/identify`, {
    user,
    ga: {
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
      session_id: BrowserTabTracker.sessionId,
    },
  })
}

export default {
  sendEvent,
  sendIdentify,
}
