import { toast } from 'sonner'

import { useDatabaseQueuePurgeMutation } from 'data/database-queues/database-queues-purge-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface PurgeQueueProps {
  queueName: string
  visible: boolean
  onClose: () => void
}

export const PurgeQueue = ({ queueName, visible, onClose }: PurgeQueueProps) => {
  const { data: project } = useSelectedProjectQuery()

  const { mutate: purgeDatabaseQueue, isLoading } = useDatabaseQueuePurgeMutation({
    onSuccess: () => {
      toast.success(`Successfully purged queue ${queueName}`)
      onClose()
    },
  })

  async function handlePurge() {
    if (!project) return console.error('Project is required')

    purgeDatabaseQueue({
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
      variant="warning"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handlePurge}
      title="Purge this queue"
      loading={isLoading}
      confirmLabel={`Purge queue ${queueName}`}
      confirmPlaceholder="Type in name of queue"
      confirmString={queueName ?? 'Unknown'}
      text={
        <>
          <span>This will purge the queue</span>{' '}
          <span className="text-bold text-foreground">{queueName}</span>
        </>
      }
      alert={{
        title:
          "This action will delete all messages from the queue. They can't be recovered afterwards.",
      }}
    />
  )
}
