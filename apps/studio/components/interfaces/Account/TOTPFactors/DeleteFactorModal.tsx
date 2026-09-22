import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { organizationKeys } from '@/data/organizations/keys'
import { useMfaUnenrollMutation } from '@/data/profile/mfa-unenroll-mutation'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'

interface DeleteFactorModalProps {
  visible: boolean
  hasRecoveryCodes: boolean
  factorId: string | null
  lastFactorToBeDeleted: boolean
  onClose: () => void
}

const DeleteFactorModal = ({
  visible,
  factorId,
  hasRecoveryCodes,
  lastFactorToBeDeleted,
  onClose,
}: DeleteFactorModalProps) => {
  const queryClient = useQueryClient()
  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const { mutate: unenroll, isPending } = useMfaUnenrollMutation({
    onSuccess: async () => {
      if (lastVisitedOrganization) {
        await queryClient.invalidateQueries({
          queryKey: organizationKeys.members(lastVisitedOrganization),
        })
      }
      toast.success(`Successfully deleted factor`)
      onClose()
    },
  })

  // Users can't delete their last MFA if they have recovery codes, they must delete them first
  // This is enforced by the backend
  if (lastFactorToBeDeleted && hasRecoveryCodes) {
    return (
      <AlertDialog
        open={visible}
        onOpenChange={(open) => {
          if (open) return
          onClose()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recovery codes are still available</AlertDialogTitle>
            <AlertDialogDescription>
              You can't delete the last factor configured for your account if you still have
              recovery codes available. Please delete them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      variant={'destructive'}
      title="Confirm to delete factor"
      confirmLabel="Delete"
      confirmLabelLoading="Deleting"
      loading={isPending}
      onCancel={onClose}
      onConfirm={() => factorId && unenroll({ factorId })}
      alert={{
        title: lastFactorToBeDeleted
          ? 'Multi-factor authentication will be disabled'
          : 'This action cannot be undone',
        description: lastFactorToBeDeleted
          ? 'There are no other factors that are set up once you delete this factor, as such your account will no longer be guarded by multi-factor authentication'
          : 'You will no longer be able to use this authenticator app for multi-factor authentication when signing in to the dashboard',
      }}
    >
      <p className="text-sm">Before deleting this factor, consider:</p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        {lastFactorToBeDeleted ? (
          <>
            <li>Adding another authenticator app as a factor prior to deleting</li>
            <li>Ensure that your account does not need multi-factor authentication</li>
            <li>
              You will lose access to any organization that enforces multi-factor authentication
            </li>
          </>
        ) : (
          <>
            <li>Your backup authenticator app is still available to use</li>
            <li>Adding another authenticator app thereafter as a backup</li>
          </>
        )}
      </ul>
    </ConfirmationModal>
  )
}

export default DeleteFactorModal
