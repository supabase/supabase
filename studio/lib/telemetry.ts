import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { User } from 'types'

export interface GoogleAnalyticsProps {
  clientId?: string
  screenResolution?: string
  language: string
}

export const getScreenResolution = () => {
  return typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined
}

const sendEvent = (
  event: {
    category: string
    action: string
    label: string
    value?: string
  },
  gaProps?: GoogleAnalyticsProps
) => {
  if (!IS_PLATFORM) return

  const { category, action, label, value } = event

  return post(`${API_URL}/telemetry/event`, {
    action: action,
    category: category,
    label: label,
    value: value,
    ga: {
      client_id: gaProps?.clientId,
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
    },
  })
}

/**
 * TODO: GA4 doesn't have identify method.
 * We may or may not need gaClientId here. Confirm later
 */
const sendIdentify = (user: User, gaProps?: GoogleAnalyticsProps) => {
  if (!IS_PLATFORM) return

  // TODO: server doesn't care about the user object sent up by client
  // confirm and clean up later
  return post(`${API_URL}/telemetry/identify`, {
    user,
    ga: {
      client_id: gaProps?.clientId,
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
    },
  })
}

export default {
  sendEvent,
  sendIdentify,
}
