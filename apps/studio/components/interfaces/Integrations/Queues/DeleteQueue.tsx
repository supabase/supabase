import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseQueueDeleteMutation } from 'data/database-queues/database-queues-delete-mutation'
import { PostgresQueue } from 'data/database-queues/database-queues-query'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteQueueProps {
  queue: PostgresQueue
  visible: boolean
  onClose: () => void
}

const DeleteQueue = ({ queue, visible, onClose }: DeleteQueueProps) => {
  const { project } = useProjectContext()

  const { mutate: deleteDatabaseQueue, isLoading } = useDatabaseQueueDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed queue ${queue.queue_name}`)
      onClose()
    },
  })

  async function handleDelete() {
    if (!project) return console.error('Project is required')

    deleteDatabaseQueue({
      queueName: queue.queue_name,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  if (!queue) {
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
      confirmLabel={`Delete queue ${queue.queue_name}`}
      confirmPlaceholder="Type in name of queue"
      confirmString={queue.queue_name ?? 'Unknown'}
      text={
        <>
          <span>This will delete the queue</span>{' '}
          <span className="text-bold text-foreground">{queue.queue_name}</span>
        </>
      }
      alert={{ title: 'You cannot recover this queue and its messages once deleted.' }}
    />
  )
}

export default DeleteQueue
