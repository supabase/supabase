import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseQueueDeleteMutation } from 'data/database-queues/database-queues-delete-mutation'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteQueueProps {
  queueName: string
  visible: boolean
  onClose: () => void
}

const DeleteQueue = ({ queueName, visible, onClose }: DeleteQueueProps) => {
  const { project } = useProjectContext()
  const router = useRouter()

  const { mutate: deleteDatabaseQueue, isLoading } = useDatabaseQueueDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed queue ${queueName}`)
      router.push(`/project/${project?.ref}/integrations/queues/queues`)
      onClose()
    },
  })

  async function handleDelete() {
    if (!project) return console.error('Project is required')

    deleteDatabaseQueue({
      queueName: queueName,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  if (!queueName) {
    return null
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete this queue"
      loading={isLoading}
      confirmLabel={`Delete queue ${queueName}`}
      confirmPlaceholder="Type in name of queue"
      confirmString={queueName ?? 'Unknown'}
      text={
        <>
          <span>This will delete the queue</span>{' '}
          <span className="text-bold text-foreground">{queueName}</span>
        </>
      }
      alert={{ title: 'You cannot recover this queue and its messages once deleted.' }}
    />
  )
}

export default DeleteQueue
