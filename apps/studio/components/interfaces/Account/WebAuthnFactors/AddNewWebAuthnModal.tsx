import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import InformationBox from 'components/ui/InformationBox'
import { auth } from 'lib/gotrue'
import { Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface AddNewWebAuthnModalProps {
  visible: boolean
  onClose: () => void
}

export const AddNewWebAuthnModal = ({ visible, onClose }: AddNewWebAuthnModalProps) => {
  // Generate a name with a number between 0 and 1000
  const [name, setName] = useState(`Security Key ${Math.floor(Math.random() * 1000)}`)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if (!visible) {
      setName(`Security Key ${Math.floor(Math.random() * 1000)}`)
      setIsRegistered(false)
    }
  }, [visible])

  const handleRegister = async () => {
    if (!name.trim()) return

    setIsRegistering(true)
    try {
      const { error } = await auth.mfa.webauthn.register(
        {
          friendlyName: name,
          rpId: window.location.hostname,
          rpOrigins: [window.location.origin],
        },
        {
          authenticatorSelection: {
            authenticatorAttachment: 'cross-platform', // Allow both platform and cross-platform
            residentKey: 'discouraged',
            userVerification: 'preferred',
            requireResidentKey: false,
          },
        }
      )

      if (error) throw error

      toast.success('Security key registered successfully!')
      setIsRegistered(true)

      // Close modal after a short delay to show success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to register security key: ${errorMessage}`)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title="Add a new security key as a factor"
      confirmLabel={isRegistered ? 'Complete' : 'Register Security Key'}
      confirmLabelLoading="Registering..."
      disabled={name.length === 0 || isRegistered}
      loading={isRegistering}
      onCancel={onClose}
      onConfirm={handleRegister}
    >
      <Input
        label="Provide a friendly name to identify this security key"
        descriptionText="A string will be randomly generated if a name is not provided"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isRegistering || isRegistered}
      />

      {isRegistered && (
        <div className="mt-4">
          <InformationBox
            title="Security Key Registered Successfully"
            description="Your security key has been registered and is now available for multi-factor authentication."
          />
        </div>
      )}

      {!isRegistered && (
        <div className="mt-4">
          <InformationBox
            title="Ready to register"
            description="Click 'Register Security Key' and follow your browser's prompts. You may need to touch your security key or provide biometric authentication."
          />
        </div>
      )}
    </ConfirmationModal>
  )
}
