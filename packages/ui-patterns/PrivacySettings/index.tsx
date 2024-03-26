import { LOCAL_STORAGE_KEYS } from 'common'
import Link from 'next/link'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Modal, Toggle } from 'ui'

import { useConsentValue } from '../ConsentToast'

export const PrivacySettings = ({
  children,
  ...props
}: PropsWithChildren<{ className?: string }>) => {
  const [isOpen, setIsOpen] = useState(false)
  const { hasAccepted, handleConsent } = useConsentValue(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
  const [telemetryValue, setTelemetryValue] = useState(hasAccepted)

  // Every time the modal opens, sync state with localStorage
  useEffect(() => {
    setTelemetryValue(localStorage?.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT) === 'true')
  }, [isOpen])

  const handleConfirmPreferences = () => {
    handleConsent && handleConsent(telemetryValue ? 'true' : 'false')
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTelemetryValue(hasAccepted)
    setIsOpen(false)
  }

  return (
    <>
      <button {...props} onClick={() => setIsOpen(true)}>
        {children}
      </button>

      <Modal
        closable
        visible={isOpen}
        alignFooter="right"
        onCancel={handleCancel}
        onConfirm={handleConfirmPreferences}
        header="Privacy Settings"
        onInteractOutside={(e) => {
          // Only hide menu when clicking outside, not focusing outside
          // Prevents Firefox dropdown issue that immediately closes menu after opening
          if (e.type === 'dismissableLayer.pointerDownOutside') {
            setIsOpen(!isOpen)
          }
        }}
        className="max-w-[calc(100vw-4rem)]"
        size="medium"
      >
        <div className="pt-6 pb-3 space-y-4">
          <Modal.Content>
            <Toggle
              checked={true}
              disabled
              onChange={() => null}
              label="Strictly necessary cookies"
              descriptionText={
                <>
                  These cookies are necessary for Supabase to function.{' '}
                  <Link
                    href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
                    className="underline"
                  >
                    Learn more
                  </Link>
                </>
              }
            />
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <Toggle
              checked={telemetryValue}
              onChange={() => setTelemetryValue((prev) => !prev)}
              label="Telemetry"
              descriptionText={
                <>
                  By opting in to sending telemetry data, Supabase can improve the overall user
                  experience.{' '}
                  <Link
                    href="https://supabase.com/privacy#cookieless-analytics"
                    className="underline"
                  >
                    Learn more
                  </Link>
                </>
              }
            />
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}
