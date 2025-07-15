import { useParams } from 'common'
import { toast } from 'sonner'

import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { User } from 'data/auth/users-infinite-query'
import { timeout } from 'lib/helpers'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteUserModalProps {
  visible: boolean
  selectedUser?: User
  onClose: () => void
  onDeleteSuccess?: () => void
}

export const DeleteUserModal = ({
  visible,
  selectedUser,
  onClose,
  onDeleteSuccess,
}: DeleteUserModalProps) => {
  const { ref: projectRef } = useParams()

  const { mutate: deleteUser, isLoading: isDeleting } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedUser?.email}`)
      onDeleteSuccess?.()
    },
  })

  const handleDeleteUser = async () => {
    await timeout(200)
    if (!projectRef) return console.error('Project ref is required')
    if (selectedUser?.id === undefined) {
      return toast.error(`Failed to delete user: User ID not found`)
    }
    deleteUser({ projectRef, userId: selectedUser.id })
  }

  return (
    <ConfirmationModal
      visible={visible}
      variant="destructive"
      title="Confirm to delete user"
      loading={isDeleting}
      confirmLabel="Delete"
      onCancel={() => onClose()}
      onConfirm={() => handleDeleteUser()}
      alert={{
        title: 'Deleting a user is irreversible',
        description:
          'This will remove the selected the user from the project and all associated data.',
      }}
    >
      <p className="text-sm text-foreground-light">
        This is permanent! Are you sure you want to delete the user{' '}
        {selectedUser?.email ?? selectedUser?.phone ?? 'this user'}?
      </p>
    </ConfirmationModal>
  )
}
