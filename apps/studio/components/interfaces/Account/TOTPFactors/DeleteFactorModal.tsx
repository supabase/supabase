import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useRecoveryCodesGate } from './useRecoveryCodesGate'
import { IdentityVerification } from '@/components/interfaces/Account/IdentityVerification'
import { AlertError } from '@/components/ui/AlertError'
import { organizationKeys } from '@/data/organizations/keys'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useMfaUnenrollMutation } from '@/data/profile/mfa-unenroll-mutation'
import { useRecoveryCodesUnenrollMutation } from '@/data/recovery-codes/recovery-codes-unenroll'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'

interface DeleteFactorModalProps {
  visible: boolean
  factorId: string | null
  onCheckingIdentity?: (isChecking: boolean) => void
  onClose: () => void
}

export const DeleteFactorModal = ({
  visible,
  factorId,
  onCheckingIdentity,
  onClose,
}: DeleteFactorModalProps) => {
  const { canUseRecoveryCodes } = useRecoveryCodesGate({ enabled: visible })

  if (!visible) return null

  return (
    <IdentityVerification
      factorToAvoidId={factorId ?? undefined}
      onCancel={onClose}
      onCheckingChange={onCheckingIdentity}
      canUseRecoveryCodes={canUseRecoveryCodes}
      returnTo={`/account/security?removeAuthenticator=${encodeURIComponent(factorId ?? '')}`}
    >
      <RemoveAuthenticatorConfirmation factorId={factorId} onClose={onClose} />
    </IdentityVerification>
  )
}

const RemoveAuthenticatorConfirmation = ({
  factorId,
  onClose,
}: Pick<DeleteFactorModalProps, 'factorId' | 'onClose'>) => {
  const queryClient = useQueryClient()
  const { data: factors } = useMfaListFactorsQuery()
  const recoveryCodes = useRecoveryCodesGate()
  const { canRemoveFactor, hasRecoveryCodes } = recoveryCodes
  const verifiedFactorCount = (factors?.totp ?? []).filter(
    (factor) => factor.status === 'verified'
  ).length
  const lastFactorToBeDeleted = verifiedFactorCount === 1
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
      toast.success('MFA method removed')
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

  const shouldExplainRecoveryCodeRemoval =
    hasRecoveryCodes || hasRemovedRecoveryCodes || unenrollRecoveryCodesMutation.isPending
  const lastAuthenticatorDescription = shouldExplainRecoveryCodeRemoval
    ? 'Removing your last MFA method disables MFA and removes your recovery codes.'
    : 'Removing your last MFA method disables MFA.'

  return (
    <ConfirmationModal
      visible
      size="medium"
      variant="destructive"
      title="Remove MFA method"
      confirmLabel="Remove"
      confirmLabelLoading="Removing"
      loading={loading}
      onCancel={handleClose}
      disabled={!factorId || !canRemoveFactor}
      onConfirm={() => {
        if (!factorId || loading || !canRemoveFactor) return
        setError(null)
        // The API requires recovery codes to be removed before the last verified authenticator.
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
          : 'You can no longer use this MFA method to sign in.',
      }}
    >
      <p className="text-sm">Before removing this MFA method, consider:</p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        {lastFactorToBeDeleted ? (
          <>
            <li>Set up another authenticator app on a different device first</li>
            <li>Check that you no longer need MFA</li>
            <li>
              You will lose access to any organization that enforces multi-factor authentication
            </li>
            {shouldExplainRecoveryCodeRemoval && <li>Your recovery codes will be removed too</li>}
          </>
        ) : (
          <>
            <li>Your other MFA method is still available to use</li>
            <li>Set up another authenticator app on a different device as a backup</li>
          </>
        )}
      </ul>
      {!canRemoveFactor && recoveryCodes.error && (
        <AlertError
          className="mt-4"
          subject="Failed to load recovery codes"
          error={recoveryCodes.error}
          showInstructions={false}
          additionalActions={
            <Button
              loading={recoveryCodes.isFetching}
              onClick={() => void recoveryCodes.refetch()}
            >
              Retry
            </Button>
          }
        />
      )}
      {error && (
        <AlertError
          className="mt-4"
          subject="Unable to remove MFA method"
          error={
            hasRemovedRecoveryCodes
              ? {
                  message: `Your recovery codes were removed, but your MFA method is still active. Try again to complete removal. ${error.message}`,
                }
              : error
          }
          showInstructions={false}
        />
      )}
    </ConfirmationModal>
  )
}
