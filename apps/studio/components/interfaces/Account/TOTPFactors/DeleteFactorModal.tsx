import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { AlertError } from '@/components/ui/AlertError'
import { organizationKeys } from '@/data/organizations/keys'
import { useMfaUnenrollMutation } from '@/data/profile/mfa-unenroll-mutation'
import { useRecoveryCodesUnenrollMutation } from '@/data/recovery-codes/recovery-codes-unenroll'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'

interface DeleteFactorModalProps {
  visible: boolean
  factorId: string | null
  lastFactorToBeDeleted: boolean
  hasRecoveryCodes: boolean
  onClose: () => void
}

export const DeleteFactorModal = ({
  visible,
  factorId,
  lastFactorToBeDeleted,
  hasRecoveryCodes,
  onClose,
}: DeleteFactorModalProps) => {
  const queryClient = useQueryClient()
  const [error, setError] = useState<{ message: string } | null>(null)
  const [hasRemovedRecoveryCodes, setHasRemovedRecoveryCodes] = useState(false)
  const handleClose = () => {
    setError(null)
    setHasRemovedRecoveryCodes(false)
    onClose()
  }

  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const unenrollMFAMutation = useMfaUnenrollMutation({
    onError: setError,
    onSuccess: async () => {
      if (lastVisitedOrganization) {
        await queryClient.invalidateQueries({
          queryKey: organizationKeys.members(lastVisitedOrganization),
        })
      }
      toast.success('Authenticator removed')
      handleClose()
    },
  })

  const unenrollRecoveryCodesMutation = useRecoveryCodesUnenrollMutation({
    onError: setError,
    onSuccess: () => {
      setHasRemovedRecoveryCodes(true)
      if (!factorId) return // Should never happen
      unenrollMFAMutation.mutate({ factorId })
    },
  })

  const loading = unenrollMFAMutation.isPending || unenrollRecoveryCodesMutation.isPending

  const lastAuthenticatorDescription =
    hasRecoveryCodes && !hasRemovedRecoveryCodes
      ? 'Removing your last authenticator disables MFA and removes your recovery codes.'
      : 'Removing your last authenticator disables MFA.'

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      variant={'destructive'}
      title="Remove authenticator"
      confirmLabel="Remove"
      confirmLabelLoading="Removing"
      loading={loading}
      onCancel={handleClose}
      disabled={!factorId}
      onConfirm={() => {
        if (!factorId || loading) return
        setError(null)
        // If users have recovery codes and this is the last MFA for their account,
        // we must first delete the recovery codes (they don't make sense without any MFA)
        const shouldDeleteRecoveryCodes =
          lastFactorToBeDeleted && hasRecoveryCodes && !hasRemovedRecoveryCodes
        if (factorId && !shouldDeleteRecoveryCodes) {
          return unenrollMFAMutation.mutate({ factorId })
        }
        unenrollRecoveryCodesMutation.mutate()
      }}
      alert={{
        title: lastFactorToBeDeleted
          ? 'Multi-factor authentication will be disabled'
          : 'This action cannot be undone',
        description: lastFactorToBeDeleted
          ? lastAuthenticatorDescription
          : 'You can no longer use this authenticator to sign in.',
      }}
    >
      {error && (
        <AlertError
          subject="Unable to remove authenticator"
          error={error}
          hideContactSupport
          showInstructions={false}
        />
      )}
      <p className="text-sm">Before removing this authenticator, consider:</p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        {lastFactorToBeDeleted ? (
          <>
            <li>Add another authenticator on a different device first</li>
            <li>Check that you no longer need MFA</li>
            <li>
              You will lose access to any organization that enforces multi-factor authentication
            </li>
            {hasRecoveryCodes && <li>Your recovery codes will be removed too</li>}
          </>
        ) : (
          <>
            <li>Your backup authenticator app is still available to use</li>
            <li>Add another authenticator on a different device as a backup</li>
          </>
        )}
      </ul>
    </ConfirmationModal>
  )
}
