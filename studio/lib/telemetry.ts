import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { User } from 'types'
import { NextRouter } from 'next/router'

export interface TelemetryProps {
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
  gaProps: TelemetryProps,
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
    },
  })
}

/**
 * TODO: GA4 doesn't have identify method.
 * We may or may not need gaClientId here. Confirm later
 */
const sendIdentify = (user: User, gaProps?: TelemetryProps) => {
  if (!IS_PLATFORM) return

  return post(`${API_URL}/telemetry/identify`, {
    user,
    ga: {
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
    },
  })
}

export default {
  sendEvent,
  sendIdentify,
}
