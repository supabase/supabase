import { post } from '~/lib/fetchWrapper'
import { API_URL, IS_PROD, IS_PREVIEW } from 'lib/constants'
import { NextRouter } from 'next/router'
import { isBrowser, LOCAL_STORAGE_KEYS } from 'common'

export interface TelemetryEvent {
  category: string
  action: string
  label: string
  value?: string
}

export interface TelemetryProps {
  screenResolution?: string
  language: string
}

const noop = () => {}

// This event is the same as in studio/lib/telemetry.tx
// but uses different ENV variables for www

const sendEvent = (event: TelemetryEvent, gaProps: TelemetryProps, router: NextRouter) => {
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  const hasAcceptedConsent = consent === 'true'
  const IS_DEV = !IS_PROD && !IS_PREVIEW
  const blockEvent = IS_DEV || !hasAcceptedConsent

  if (blockEvent) return noop

  const { category, action, label, value } = event
  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return post(
    `${API_URL}/telemetry/event`,
    {
      action: action,
      page_url: window.location.href,
      page_title: title,
      pathname: router.pathname,
      ph: {
        referrer,
        language: router?.locale ?? 'en-US',
        userAgent: navigator.userAgent,
        search: window.location.search,
        viewport_height: isBrowser ? window.innerHeight : 0,
        viewport_width: isBrowser ? window.innerWidth : 0,
      },
      custom_properties: { category, label, value } as any,
    },
    { headers: { Version: '2' } }
  )
}

export default {
  sendEvent,
}
