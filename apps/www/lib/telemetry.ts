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
  userAgent?: string
  viewportHeight?: number
  viewportWidth?: number
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
      pageUrl: document?.location.href,
      pageTitle: document?.title,
      pathname: router.asPath,
      ph: {
        referrer: document?.referrer,
        ...phProps,
      },
      customProperties: {
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
