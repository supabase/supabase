// hooks/useTelemetryCookie.ts
import { useRouter } from 'next/compat/router'
import { useEffect } from 'react'
import { IS_PROD, LOCAL_STORAGE_KEYS } from '../constants'
import { getSharedTelemetryData } from '../telemetry-utils'

interface UseTelemetryCookieProps {
  hasAcceptedConsent: boolean
  title: string
  referrer: string
}

/**
 * This hook saves the telemetry data to a cookie. The cookie will be sent when the user consents to telemetry. If they
 * don't consent, the cookie will never be sent.
 */
export function useTelemetryCookie({
  hasAcceptedConsent,
  title,
  referrer,
}: UseTelemetryCookieProps) {
  const router = useRouter()
  const telemetryStorageKey = LOCAL_STORAGE_KEYS.TELEMETRY_DATA

  useEffect(() => {
    if (!router?.isReady) return

    const cookies = document.cookie.split(';')
    const cookieOptions = IS_PROD ? 'path=/; domain=supabase.com' : 'path=/'

    const telemetryCookie = cookies.find((cookie) => cookie.trim().startsWith(telemetryStorageKey))
    if (telemetryCookie) return

    const telemetryData = getSharedTelemetryData(router.pathname)

    if (!hasAcceptedConsent) {
      const encodedData = encodeURIComponent(JSON.stringify(telemetryData))
      document.cookie = `${telemetryStorageKey}=${encodedData}; ${cookieOptions}`
    }
  }, [hasAcceptedConsent, router?.isReady, telemetryStorageKey, title, router?.pathname, referrer])
}

export default useTelemetryCookie
