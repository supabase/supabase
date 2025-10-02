import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useQueryClient } from '@tanstack/react-query'
import { Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import InformationBox from 'components/ui/InformationBox'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { organizationKeys } from 'data/organizations/keys'
import { useMfaWebAuthnRegisterMutation } from 'data/profile/mfa-webauthn-register-mutation'
import { LOCAL_STORAGE_KEYS } from 'common'

interface AddNewWebAuthnModalProps {
  visible: boolean
  onClose: () => void
}

export const AddNewWebAuthnModal = ({ visible, onClose }: AddNewWebAuthnModalProps) => {
  const [name, setName] = useState(`Security key ${Math.floor(Math.random() * 1000)}`)

  const queryClient = useQueryClient()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const {
    mutate: register,
    isLoading: isVerifying,
    isSuccess,
    reset,
  } = useMfaWebAuthnRegisterMutation({
    onError: (error) => {
      toast.error(`Failed to add a second factor authentication:  ${error?.message}`)
    },
    onSuccess: async () => {
      if (lastVisitedOrganization) {
        await queryClient.invalidateQueries(organizationKeys.members(lastVisitedOrganization))
      }
      toast.success(`Successfully added a second factor authentication`)
      onClose()
    },
  })

  useEffect(() => {
    if (!visible) {
      setName(`Security key ${Math.floor(Math.random() * 1000)}`)
      reset()
    }
  }, [reset, visible])

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title="Add a new security key as a factor"
      confirmLabel={isSuccess ? 'Complete' : 'Register security key'}
      confirmLabelLoading="Registering..."
      disabled={name.length === 0 || isSuccess}
      loading={isVerifying}
      onCancel={() => {
        reset()
        onClose()
      }}
      onConfirm={() =>
        register({
          friendlyName: name,
          rpId: window.location.hostname,
          rpOrigins: [window.location.origin],
        })
      }
    >
      <Input
        label="Provide a friendly name to identify this security key"
        descriptionText="A string will be randomly generated if a name is not provided"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isVerifying || isSuccess}
      />

      {isSuccess && (
        <div className="mt-4">
          <InformationBox
            title="Security key Registered Successfully"
            description="Your security key has been registered and is now available for multi-factor authentication."
          />
        </div>
      )}

      {!isSuccess && (
        <div className="mt-4">
          <InformationBox
            title="Ready to register"
            description="Click 'Register security key' and follow your browser's prompts. You may need to touch your security key or provide biometric authentication."
          />
        </div>
      )}
    </ConfirmationModal>
  )
}
