import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseQueuePurgeMutation } from 'data/database-queues/database-queues-purge-mutation'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface PurgeQueueProps {
  queueName: string
  visible: boolean
  onClose: () => void
}

const PurgeQueue = ({ queueName, visible, onClose }: PurgeQueueProps) => {
  const { project } = useProjectContext()
  const router = useRouter()

  const { mutate: purgeDatabaseQueue, isLoading } = useDatabaseQueuePurgeMutation({
    onSuccess: () => {
      toast.success(`Successfully purged queue ${queueName}`)
      router.push(`/project/${project?.ref}/integrations/queues`)
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

export default PurgeQueue
