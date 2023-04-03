import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { PostgresTrigger } from '@supabase/postgres-meta'

interface DeleteHookModalProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

const DeleteHookModal = ({ selectedHook, visible, onClose }: DeleteHookModalProps) => {
  const { ui } = useStore()
  const [loading, setLoading] = useState(false)
  const { id, name, schema } = selectedHook ?? {}

  const { project } = useProjectContext()
  const { mutateAsync: deleteDatabaseTrigger } = useDatabaseTriggerDeleteMutation()

  async function handleDelete() {
    if (!project) {
      return console.error('Project ref is required')
    }
    if (!id) {
      return ui.setNotification({ category: 'error', message: 'Unable find selected hook' })
    }

    try {
      setLoading(true)
      await deleteDatabaseTrigger({
        id,
        projectRef: project.ref,
        connectionString: project.connectionString,
      })
      ui.setNotification({ category: 'success', message: `Successfully deleted ${name}` })
      onClose()
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${name}: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete database webhook"
      loading={loading}
      confirmLabel={`Delete ${name}`}
      confirmPlaceholder="Type in name of webhook"
      confirmString={name || ''}
      text={`This will delete the webhook "${name}" from the schema "${schema}".`}
      alert="You cannot recover this webhook once it is deleted!"
    />
  )
}

export default observer(DeleteHookModal)
