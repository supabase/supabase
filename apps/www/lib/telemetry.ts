import { post } from '~/lib/fetchWrapper'
import { API_URL, IS_PROD, IS_PREVIEW } from 'lib/constants'
import { NextRouter } from 'next/router'
import { LOCAL_STORAGE_KEYS } from 'common'

export interface TelemetryEvent {
  category: string
  action: string
  label: string
  value?: string
}

export interface TelemetryProps {
  language: string
  search?: string
  user_agent?: string
  viewport_height?: number
  viewport_width?: number
}

const noop = () => {}

// This event is the same as in studio/lib/telemetry.tx
// but uses different ENV variables for www

const sendEvent = (event: TelemetryEvent, phProps: TelemetryProps, router: NextRouter) => {
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  const hasAcceptedConsent = consent === 'true'
  const IS_DEV = !IS_PROD && !IS_PREVIEW
  const blockEvent = IS_DEV || !hasAcceptedConsent

  if (blockEvent) return noop

  const { category, action, label, value } = event
  return post(
    `${API_URL}/telemetry/event`,
    {
      action,
      page_url: document?.location.href,
      page_title: document?.title,
      pathname: router.asPath,
      ph: {
        referrer: document?.referrer,
        ...phProps,
      },
      custom_properties: {
        category,
        label,
        value,
      },
    },
    {
      credentials: 'include',
    }
  )
}

export default {
  sendEvent,
}
