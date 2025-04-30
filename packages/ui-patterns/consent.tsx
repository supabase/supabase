import type Usercentrics from '@usercentrics/cmp-browser-sdk'
import type { BaseCategory, UserDecision } from '@usercentrics/cmp-browser-sdk'
import { LOCAL_STORAGE_KEYS, handlePageTelemetry, isBrowser, useFeatureFlags } from 'common'
import { useRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import { proxy, useSnapshot } from 'valtio'
import { ConsentToast } from './ConsentToast'

const consentState = proxy({
  // Usercentrics state
  UC: null as Usercentrics | null,
  categories: null as BaseCategory[] | null,

  // Our state
  showConsentToast: false,
  hasConsented: false,
  acceptAll: () => {
    if (!consentState.UC) return
    const previousConsentValue = consentState.hasConsented

    consentState.hasConsented = true
    consentState.showConsentToast = false

    consentState.UC.acceptAllServices()
      .then(() => {
        consentState.categories = consentState.UC?.getCategoriesBaseInfo() ?? null
      })
      .catch(() => {
        toast.error('Failed to accept all services')
        consentState.hasConsented = previousConsentValue
        consentState.showConsentToast = true
      })
  },
  denyAll: () => {
    if (!consentState.UC) return
    const previousConsentValue = consentState.hasConsented

    consentState.hasConsented = false
    consentState.showConsentToast = false

    consentState.UC.denyAllServices()
      .then(() => {
        consentState.categories = consentState.UC?.getCategoriesBaseInfo() ?? null
      })
      .catch(() => {
        toast.error('Failed to deny all services')
        consentState.showConsentToast = previousConsentValue
      })
  },
  updateServices: (decisions: UserDecision[]) => {
    if (!consentState.UC) return

    consentState.showConsentToast = false

    consentState.UC.updateServices(decisions)
      .then(() => {
        consentState.hasConsented = consentState.UC?.areAllConsentsAccepted() ?? false
        consentState.categories = consentState.UC?.getCategoriesBaseInfo() ?? null
      })
      .catch(() => {
        toast.error('Failed to update services')
        consentState.showConsentToast = true
      })
  },
})

async function initUserCentrics() {
  // Usercentrics is not available on the server
  if (!isBrowser) return

  const { default: Usercentrics } = await import('@usercentrics/cmp-browser-sdk')

  const UC = new Usercentrics(process.env.NEXT_PUBLIC_USERCENTRICS_RULESET_ID!, {
    rulesetId: process.env.NEXT_PUBLIC_USERCENTRICS_RULESET_ID,
    useRulesetId: true,
  })

  const initialUIValues = await UC.init()

  consentState.UC = UC
  const hasConsented = UC.areAllConsentsAccepted()

  // 0 = first layer, aka show consent toast
  consentState.showConsentToast = initialUIValues.initialLayer === 0
  consentState.hasConsented = hasConsented
  consentState.categories = UC.getCategoriesBaseInfo()

  // If the user has previously consented (before usercentrics), accept all services
  if (!hasConsented && localStorage?.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT) === 'true') {
    consentState.acceptAll()
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
  }
}

initUserCentrics()

export const useConsent = () => {
  const { TELEMETRY_DATA } = LOCAL_STORAGE_KEYS
  const consentToastId = useRef<string | number>()
  const router = useRouter()
  const appRouterPathname = usePathname()
  const featureFlags = useFeatureFlags()

  const snap = useSnapshot(consentState)
  const pathname =
    router?.pathname ?? appRouterPathname ?? (isBrowser ? window.location.pathname : '')

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return

    if (value === 'true') {
      snap.acceptAll()
      const cookies = document.cookie.split(';')
      const telemetryCookie = cookies.find((cookie) => cookie.trim().startsWith(TELEMETRY_DATA))
      if (telemetryCookie) {
        try {
          const encodedData = telemetryCookie.split('=')[1]
          const telemetryData = JSON.parse(decodeURIComponent(encodedData))
          handlePageTelemetry(
            process.env.NEXT_PUBLIC_API_URL!,
            pathname,
            featureFlags.posthog,
            telemetryData
          )
          // remove the telemetry cookie
          document.cookie = `${TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        } catch (error) {
          console.error('Invalid telemetry data:', error)
        }
      } else {
        handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, pathname, featureFlags.posthog)
      }
    } else {
      snap.denyAll()
      // remove the telemetry cookie
      document.cookie = `${TELEMETRY_DATA}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }

    if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }

  useEffect(() => {
    if (isBrowser && snap.showConsentToast) {
      consentToastId.current = toast(
        <ConsentToast
          onAccept={() => handleConsent('true')}
          onOptOut={() => handleConsent('false')}
        />,
        {
          id: 'consent-toast',
          position: 'bottom-right',
          duration: Infinity,
          closeButton: false,
          dismissible: false,
          className: cn(
            '!w-screen !fixed !border-t !h-auto !left-0 !bottom-0 !top-auto !right-0 !rounded-none !max-w-none !bg-overlay !text',
            'sm:!w-full sm:!max-w-[356px] sm:!left-auto sm:!right-8 sm:!bottom-8 sm:!rounded-lg sm:border'
          ),
        }
      )
    } else if (consentToastId.current) {
      toast.dismiss(consentToastId.current)
    }
  }, [snap.showConsentToast])

  return {
    hasAcceptedConsent: snap.hasConsented,
  }
}

// Public API for consent
export const useConsentState = () => {
  const snap = useSnapshot(consentState)

  return {
    hasAccepted: snap.hasConsented,
    categories: snap.categories,
    acceptAll: snap.acceptAll,
    denyAll: snap.denyAll,
    updateServices: snap.updateServices,
  }
}
