import type { PostgresTrigger } from '@supabase/postgres-meta'
import { toast } from 'sonner'

import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

interface DeleteHookModalProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
  onDeleteStart?: (hookId: string) => void
}

const DeleteHookModal = ({
  selectedHook,
  visible,
  onClose,
  onDeleteStart,
}: DeleteHookModalProps) => {
  const { name, schema } = selectedHook ?? {}

  const { data: project } = useSelectedProjectQuery()
  const { mutate: deleteDatabaseTrigger, isPending: isDeleting } = useDatabaseTriggerDeleteMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully deleted ${name}`)
        onClose()
      },
    }
  )

  async function handleDelete() {
    if (!project) {
      return console.error('Project ref is required')
    }
    if (!selectedHook) {
      return toast.error('Unable find selected hook')
    }

    onDeleteStart?.(selectedHook.id.toString())
    deleteDatabaseTrigger({
      trigger: selectedHook,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  return (
    <TextConfirmModal
      variant="destructive"
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
          This will delete the webhook <span className="text-bold text-foreground">{name}</span>{' '}
          from the schema <span className="text-bold text-foreground">{schema}</span>
        </>
      }
      alert={{ title: 'You cannot recover this webhook once deleted.' }}
    />
  )
}

export default DeleteHookModal
