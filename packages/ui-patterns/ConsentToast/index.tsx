import { LOCAL_STORAGE_KEYS, handlePageTelemetry, isBrowser, useTelemetryProps } from 'common'
import { noop } from 'lodash'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from 'ui'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

export const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  return (
    <div className="space-y-3 py-1">
      <div>
        <p className="text-foreground">
          We only collect analytics essential to ensuring smooth operation of our services.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button type="default" onClick={onAccept}>
          Accept
        </Button>
        <Button type="text" onClick={onOptOut}>
          Opt out
        </Button>
        <Button asChild type="text">
          <Link target="_blank" rel="noreferrer" href="https://supabase.com/privacy">
            Learn more
          </Link>
        </Button>
      </div>
    </div>
  )
}

// Use with PortalToast from 'ui/src/layout/PortalToast'
export const useConsent = () => {
  const { TELEMETRY_CONSENT } = LOCAL_STORAGE_KEYS
  const consentToastId = useRef<string>()
  const isClient = typeof window !== 'undefined'
  if (!isClient) return {}
  const telemetryProps = useTelemetryProps()
  const [consentValue, setConsentValue] = useState<string | null>(
    localStorage?.getItem(TELEMETRY_CONSENT)
  )

  const handleConsent = (value: 'true' | 'false') => {
    if (!isClient) return
    setConsentValue(value)
    localStorage.setItem(TELEMETRY_CONSENT, value)

    if (consentToastId.current) toast.dismiss(consentToastId.current)
    if (value === 'true')
      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname, telemetryProps)
  }

  useEffect(() => {
    const handleSetLocalStorage = () => {
      if (localStorage?.getItem(TELEMETRY_CONSENT)) toast.dismiss(consentToastId.current)
    }

    window.addEventListener('storage', handleSetLocalStorage)
    return window.removeEventListener('storage', () => null)
  }, [])

  useEffect(() => {
    if (isClient && consentValue === null) {
      consentToastId.current = toast(
        <ConsentToast
          onAccept={() => handleConsent('true')}
          onOptOut={() => handleConsent('false')}
        />,
        {
          id: 'consent-toast',
          position: 'bottom-right',
          duration: Infinity,
          className:
            '!w-screen !-m-4 !border-t !rounded-none !max-w-none !bg-overlay !text sm:!m-0 sm:!rounded-lg sm:!w-auto sm:!max-w-[400px] sm:border',
        }
      )
    }
  }, [consentValue])

  return { consentValue, setConsentValue, hasAcceptedConsent: consentValue === 'true' }
}

export const useConsentValue = (KEY_NAME: string) => {
  if (!isBrowser) return {}

  const telemetryProps = useTelemetryProps()
  const [consentValue, setConsentValue] = useState<string | null>(localStorage?.getItem(KEY_NAME))

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(KEY_NAME, value)
    window.dispatchEvent(new Event('storage'))
    if (value === 'true')
      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname, telemetryProps)
  }

  return {
    consentValue,
    setConsentValue,
    hasAccepted: consentValue === 'true',
    handleConsent,
  }
}
