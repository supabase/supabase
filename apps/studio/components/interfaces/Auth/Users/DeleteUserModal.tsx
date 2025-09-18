import { useParams } from 'common'
import { toast } from 'sonner'

import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { User } from 'data/auth/users-infinite-query'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useState } from 'react'

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

  const [softDelete, setSoftDelete] = useState(false)

  const { mutate: deleteUser, isLoading: isDeleting } = useUserDeleteMutation({
    onSuccess: () => {
      const userLabel = selectedUser?.email ?? selectedUser?.phone ?? 'user'
      toast.success(`Successfully ${softDelete ? 'soft deleted' : 'deleted'} ${userLabel}`)
      onDeleteSuccess?.()
    },
  })

  const handleDeleteUser = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedUser?.id === undefined) {
      return toast.error(`Failed to delete user: User ID not found`)
    }
    deleteUser({ projectRef, userId: selectedUser.id, softDelete })
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
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={softDelete}
          onChange={(e) => setSoftDelete(e.target.checked)}
        />
        <span className="text-sm">Soft-delete (preserves data associated with the user record for data auditing)</span>
      </label>
      <p className="text-sm text-foreground-light">
        This is permanent! Are you sure you want to delete the user{' '}
        {selectedUser?.email ?? selectedUser?.phone ?? 'this user'}?
      </p>
    </ConfirmationModal>
  )
}
