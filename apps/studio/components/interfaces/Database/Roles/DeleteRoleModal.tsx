import type { PostgresRole } from '@supabase/postgres-meta'
import toast from 'react-hot-toast'
import { Modal } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseRoleDeleteMutation } from 'data/database-roles/database-role-delete-mutation'

interface DeleteRoleModalProps {
  role: PostgresRole
  visible: boolean
  onClose: () => void
}

const DeleteRoleModal = ({ role, visible, onClose }: DeleteRoleModalProps) => {
  const { project } = useProjectContext()

  const { mutate: deleteDatabaseRole, isLoading: isDeleting } = useDatabaseRoleDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted role: ${role.name}`)
      onClose()
    },
  })

  const deleteRole = async () => {
    if (!project) return console.error('Project is required')
    if (!role) return console.error('Failed to delete role: role is missing')
    deleteDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: role.id,
    })
  }

  return (
    <Modal
      size="small"
      alignFooter="right"
      visible={visible}
      onCancel={onClose}
      onConfirm={deleteRole}
      header={<h3>Confirm to delete role "{role?.name}"</h3>}
      loading={isDeleting}
    >
      <Modal.Content>
        <p className="text-sm">
          This will automatically revoke any membership of this role in other roles, and this action
          cannot be undone.
        </p>
      </Modal.Content>
    </Modal>
  )
}

export default DeleteRoleModal
