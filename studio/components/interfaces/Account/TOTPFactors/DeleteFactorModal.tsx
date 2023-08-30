import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useMfaUnenrollMutation } from 'data/profile/mfa-unenroll-mutation'
import { useStore } from 'hooks'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertTriangle,
  Modal,
} from 'ui'

export const DeleteFactorModal = ({
  factorId,
  lastFactorToBeDeleted,
  onClose,
}: {
  factorId: string
  lastFactorToBeDeleted: boolean
  onClose: () => void
}) => {
  const { ui } = useStore()

  const { mutate: unenroll, isLoading } = useMfaUnenrollMutation({
    onError: (error) => {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete a second factor authentication:  ${error?.message}`,
      })
    },
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted a second factor authentication.`,
      })
      onClose()
    },
  })

  return (
    <ConfirmationModal
      size="medium"
      visible
      danger
      header="Confirm to delete factor"
      buttonLabel="Delete"
      buttonLoadingLabel="Deleting"
      loading={isLoading}
      onSelectCancel={onClose}
      onSelectConfirm={() => {
        unenroll({ factorId })
      }}
    >
      <Modal.Content className="py-6">
        <Alert_Shadcn_ variant="warning">
          <IconAlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>
            {lastFactorToBeDeleted
              ? 'Multi-factor authentication will be disabled'
              : 'This action cannot be undone'}
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            {lastFactorToBeDeleted
              ? 'There are no other factors that are set up once you delete this factor, as such your account will no longer be guarded by multi-factor authentication'
              : 'You will no longer be able to use this authenticator app for multi-factor authentication when signing in to the dashboard'}
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
        <div className="text-sm px-1 pt-4">
          <span className="font-bold">Before deleting this factor, consider:</span>
          <ul className="text-scale-900 py-1 list-disc mx-4 space-y-1">
            {lastFactorToBeDeleted ? (
              <>
                <li>Adding another authenticator app as a factor prior to deleting</li>
                <li>Ensure that your account does not need multi-factor authentication</li>
              </>
            ) : (
              <>
                <li>Your backup authenticator app is still available to use</li>
                <li>Adding another authenticator app thereafter as a backup</li>
              </>
            )}
          </ul>
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}
