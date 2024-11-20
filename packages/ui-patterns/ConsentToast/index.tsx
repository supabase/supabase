'use client'

import {
  LOCAL_STORAGE_KEYS,
  handlePageTelemetry,
  isBrowser,
  useBreakpoint,
  useTelemetryProps,
} from 'common'
import { noop } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn } from 'ui'
import { PrivacySettings } from '../PrivacySettings'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

export const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  const isMobile = useBreakpoint(639)

  return (
    <div className="py-1 flex flex-col gap-y-3 w-full">
      <div>
        <p className="text-sm text-foreground">
          We use first-party cookies to improve our services.{' '}
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
            className="hidden sm:inline underline underline-offset-2 decoration-foreground-lighter hover:decoration-foreground-light transition-all"
          >
            Learn more
          </a>{' '}
        </p>
        <div className="flex items-center justify-start gap-x-2 sm:hidden">
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
            className="underline underline-offset-2 text-foreground-light hover:decoration-foreground-light transition-all"
          >
            Learn more
          </a>
          <span className="text-foreground-lighter text-xs">•</span>
          <PrivacySettings className="underline underline-offset-2 inline text-light">
            Privacy settings
          </PrivacySettings>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="default"
          onClick={onAccept}
          size={isMobile ? 'small' : 'tiny'}
          block={isMobile}
        >
          Accept
        </Button>
        <Button
          type={isMobile ? 'outline' : 'text'}
          onClick={onOptOut}
          size={isMobile ? 'small' : 'tiny'}
          block={isMobile}
        >
          Opt out
        </Button>
        <Button asChild type="text" className="hidden sm:block text-light hover:text-foreground">
          <PrivacySettings>Privacy settings</PrivacySettings>
        </Button>
      </div>
    </div>
  )
}

export const useConsent = () => {
  const { TELEMETRY_CONSENT } = LOCAL_STORAGE_KEYS
  const consentToastId = useRef<string | number>()
  const telemetryProps = useTelemetryProps()

  const initialValue = isBrowser ? localStorage?.getItem(TELEMETRY_CONSENT) : null
  const [consentValue, setConsentValue] = useState<string | null>(initialValue)

  const handleConsent = (value: 'true' | 'false') => {
    if (!isBrowser) return
    setConsentValue(value)
    localStorage.setItem(TELEMETRY_CONSENT, value)

    if (consentToastId.current) toast.dismiss(consentToastId.current)
    if (value === 'true')
      handlePageTelemetry(process.env.NEXT_PUBLIC_API_URL!, location.pathname, telemetryProps)
  }

  const triggerConsentToast = useCallback(() => {
    if (isBrowser && consentValue === null) {
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
    }
  }, [])

  useEffect(() => {
    const handleSetLocalStorage = () => {
      if (localStorage?.getItem(TELEMETRY_CONSENT)) toast.dismiss(consentToastId.current)
    }

    if (isBrowser) {
      window.addEventListener('storage', handleSetLocalStorage)
      return window.removeEventListener('storage', () => null)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      consentValue === null && triggerConsentToast()
    }, 300)
  }, [consentValue])

  return {
    consentValue,
    setConsentValue,
    hasAcceptedConsent: consentValue === 'true',
    triggerConsentToast,
  }
}

export const useConsentValue = (KEY_NAME: string) => {
  const telemetryProps = useTelemetryProps()
  const initialValue = isBrowser ? localStorage?.getItem(KEY_NAME) : null
  const [consentValue, setConsentValue] = useState<string | null>(initialValue)

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
