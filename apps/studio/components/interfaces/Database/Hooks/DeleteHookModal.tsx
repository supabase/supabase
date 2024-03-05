import type { PostgresTrigger } from '@supabase/postgres-meta'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
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
      variant={'warning'}
      visible={visible}
      size="medium"
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete database webhook"
      loading={isDeleting}
      confirmLabel={`Delete ${name}`}
      confirmPlaceholder="Type in name of webhook"
      confirmString={name || ''}
      text={
        <>
          This will delete the webhook
          <span className="text-bold text-foreground">{name}</span> rom the schema
          <span className="text-bold text-foreground">{schema}</span>
        </>
      }
      alert={{ title: 'You cannot recover this webhook once deleted.' }}
    />
  )
}

export default DeleteHookModal
