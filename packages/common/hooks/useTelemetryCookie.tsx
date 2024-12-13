// hooks/useTelemetryCookie.ts
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { IS_PROD } from 'common'

interface TelemetryProps {
  referrer: string
  language: string
  search: string
  viewport_height: number
  viewport_width: number
}

interface UseTelemetryCookieProps {
  consentValue: string | null
  telemetryStorageKey: string
  title: string
  telemetryProps: TelemetryProps
  blockEvents?: boolean
}

export function useTelemetryCookie({
  consentValue,
  telemetryStorageKey,
  title,
  telemetryProps,
  blockEvents = false,
}: UseTelemetryCookieProps) {
  const router = useRouter()
  const { referrer, language, search, viewport_height, viewport_width } = telemetryProps

  useEffect(() => {
    if (!router.isReady) return

    //if (!blockEvents) return

    const cookies = document.cookie.split(';')
    const cookieOptions = IS_PROD ? 'path=/; domain=supabase.com' : 'path=/'

    const telemetryCookie = cookies.find((cookie) => cookie.trim().startsWith(telemetryStorageKey))
    if (telemetryCookie) return
    console.log('telemetryCookie', telemetryCookie)

    const telemetryData = {
      page_url: window.location.href,
      page_title: title,
      pathname: router.pathname,
      ph: {
        referrer,
        language,
        search,
        viewport_height,
        viewport_width,
        user_agent: navigator.userAgent,
      },
    }

    console.log('consentValue', consentValue)
    if (consentValue === null) {
      console.log('consentValue is null')
      const encodedData = encodeURIComponent(JSON.stringify(telemetryData))
      document.cookie = `${telemetryStorageKey}=${encodedData}; ${cookieOptions}`
    }
  }, [
    consentValue,
    router.isReady,
    telemetryStorageKey,
    title,
    router.pathname,
    referrer,
    language,
    search,
    viewport_height,
    viewport_width,
  ])
}

export default useTelemetryCookie
