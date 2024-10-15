import { LOCAL_STORAGE_KEYS, TelemetryProps } from 'common'
import { API_URL, IS_PREVIEW, IS_PROD } from 'lib/constants'
import { NextRouter } from 'next/router'
import { post } from '~/lib/fetchWrapper'
import { Telemetry } from 'telemetry'

const noop = () => {}

// This event is the same as in studio/lib/telemetry.tx
// but uses different ENV variables for www

const sendEvent = (
  event: Telemetry.EventWithProperties,
  telemetryProps: TelemetryProps,
  router: NextRouter
) => {
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  const hasAcceptedConsent = consent === 'true'
  const IS_DEV = !IS_PROD && !IS_PREVIEW
  const blockEvent = IS_DEV || !hasAcceptedConsent

  if (blockEvent) return noop

  const { action, properties } = event
  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  const { page_url, search, language, viewport_height, viewport_width } = telemetryProps

  return post(
    `${API_URL}/telemetry/event`,
    {
      page_url,
      action,
      page_title: title,
      pathname: router.pathname,
      ph: {
        search,
        referrer,
        language,
        viewport_height,
        viewport_width,
        user_agent: navigator.userAgent,
      },
      custom_properties: properties,
    },
    { headers: { Version: '2' }, credentials: 'include' }
  )
}

const telemetry = { sendEvent }

export default telemetry
