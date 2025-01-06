'use client'

import { useState } from 'react'

import { handlePageTelemetry, isBrowser, useTelemetryProps } from 'common'

export const useConsentValue = (KEY_NAME: string) => {
  const telemetryProps = useTelemetryProps()
  const initialValue = isBrowser ? localStorage?.getItem(KEY_NAME) : null
  const [consentValue, setConsentValue] = useState<string | null>(initialValue)

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(KEY_NAME, value)
    window.dispatchEvent(new Event('storage'))
    if (value === 'true') {
      const telemetryData = {
        page_url: telemetryProps.page_url,
        page_title: typeof document !== 'undefined' ? document?.title : '',
        pathname: telemetryProps.pathname,
        ph: {
          referrer: typeof document !== 'undefined' ? document?.referrer : '',
          language: telemetryProps.language,
          search: telemetryProps.search,
          viewport_height: telemetryProps.viewport_height,
          viewport_width: telemetryProps.viewport_width,
          user_agent: navigator.userAgent,
        },
      }

      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname, telemetryData)
    }
  }

  return {
    consentValue,
    setConsentValue,
    hasAccepted: consentValue === 'true',
    handleConsent,
  }
}
