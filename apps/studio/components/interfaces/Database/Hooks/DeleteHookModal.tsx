import { PostgresTrigger } from '@supabase/postgres-meta'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { useStore } from 'hooks'

interface DeleteHookModalProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

const DeleteHookModal = ({ selectedHook, visible, onClose }: DeleteHookModalProps) => {
  const { ui } = useStore()
  const { id, name, schema } = selectedHook ?? {}

  const { project } = useProjectContext()
  const { mutate: deleteDatabaseTrigger, isLoading: isDeleting } = useDatabaseTriggerDeleteMutation(
    {
      onSuccess: () => {
        ui.setNotification({ category: 'success', message: `Successfully deleted ${name}` })
        onClose()
      },
    }
  )

  async function handleDelete() {
    if (!project) {
      return console.error('Project ref is required')
    }
    if (!id) {
      return ui.setNotification({ category: 'error', message: 'Unable find selected hook' })
    }

    deleteDatabaseTrigger({
      id,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete database webhook"
      loading={isDeleting}
      confirmLabel={`Delete ${name}`}
      confirmPlaceholder="Type in name of webhook"
      confirmString={name || ''}
      text={`This will delete the webhook "${name}" from the schema "${schema}".`}
      alert="You cannot recover this webhook once it is deleted!"
    />
  )
}

export default DeleteHookModal
