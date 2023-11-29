import { PostgresRole } from '@supabase/postgres-meta'
import { useState } from 'react'
import { Modal } from 'ui'

import { useStore } from 'hooks'

interface DeleteRoleModalProps {
  role: PostgresRole
  visible: boolean
  onClose: () => void
}

const DeleteRoleModal = ({ role, visible, onClose }: DeleteRoleModalProps) => {
  const { ui, meta } = useStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteRole = async () => {
    if (!role) return console.error('Failed to delete role: role is missing')

    setIsDeleting(true)
    const res: any = await meta.roles.del(role.id)
    setIsDeleting(false)
    if (res.error) {
      return ui.setNotification({
        category: 'error',
        message: `Failed to delete role: ${res.error.message}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted role: "${role.name}"`,
      })
      onClose()
    }
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
      <div className="py-4">
        <Modal.Content>
          <p className="text-sm">
            This will automatically revoke any membership of this role in other roles, and this
            action cannot be undone.
          </p>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default DeleteRoleModal
