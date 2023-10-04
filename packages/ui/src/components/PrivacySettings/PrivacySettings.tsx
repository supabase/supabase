import { useConsentValue, handlePageTelemetry, useTelemetryProps } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useState } from 'react'
import { Modal, Toggle, cn } from 'ui'

const PrivacySettings = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  const { basePath } = useRouter()
  const { hasAccepted, handleConsent } = useConsentValue('supabase-consent')
  const [telemetryValue, setTelemetryValue] = useState(hasAccepted)
  const [isOpen, setIsOpen] = useState(false)

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
      <button onClick={() => setIsOpen(true)} className={cn(className)}>
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
                  <Link href="/privacy#4-how-we-use-cookies-and-other-tracking-technology-to-collect-information">
                    <a className="underline">Learn more</a>
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
              descriptionText="By opting in to sending telemetry data, Supabase can improve the overall user
          experience."
            />
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default PrivacySettings
