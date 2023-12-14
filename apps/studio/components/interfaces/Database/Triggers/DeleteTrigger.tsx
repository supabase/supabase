import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'

interface DeleteTriggerProps {
  trigger?: any
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteTrigger = ({ trigger, visible, setVisible }: DeleteTriggerProps) => {
  const { project } = useProjectContext()
  const { id, name, schema } = trigger ?? {}

  const { mutate: deleteDatabaseTrigger, isLoading } = useDatabaseTriggerDeleteMutation()

  async function handleDelete() {
    if (!project) return console.error('Project is required')
    if (!id) return console.error('Trigger ID is required')

    deleteDatabaseTrigger(
      {
        projectRef: project.ref,
        connectionString: project.connectionString,
        id,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully removed ${name}`)
          setVisible(false)
        },
      }
    )
  }

  return (
    <TextConfirmModal
      visible={visible}
      onCancel={() => setVisible(!visible)}
      onConfirm={handleDelete}
      title="Delete this trigger"
      loading={isLoading}
      confirmLabel={`Delete trigger ${name}`}
      confirmPlaceholder="Type in name of trigger"
      confirmString={name}
      text={`This will delete your trigger called ${name} of schema ${schema}.`}
      alert="You cannot recover this trigger once it is deleted!"
    />
  )
}

export default DeleteTrigger
