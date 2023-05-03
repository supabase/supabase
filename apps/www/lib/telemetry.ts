import { post } from '~/lib/fetchWrapper'
import { API_URL, IS_PROD } from 'lib/constants'

export interface GoogleAnalyticsEvent {
  category: string
  action: string
  label: string
  value?: string
}

export interface GoogleAnalyticsProps {
  screenResolution?: string
  language: string
}

// This event is the same as in studio/lib/telemetry.tx
// but uses different ENV variables for www

const sendEvent = (event: GoogleAnalyticsEvent, gaProps: GoogleAnalyticsProps) => {
  if (!IS_PROD) return

  const { category, action, label, value } = event

  return post(`${API_URL}/telemetry/event`, {
    action: action,
    category: category,
    label: label,
    value: value,
    ga: {
      screen_resolution: gaProps?.screenResolution,
      language: gaProps?.language,
    },
  })
}

export default {
  sendEvent,
}
