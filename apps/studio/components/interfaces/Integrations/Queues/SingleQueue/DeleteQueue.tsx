import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useDatabaseQueueDeleteMutation } from '@/data/database-queues/database-queues-delete-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { navigateToUrl } from '@/lib/navigation'

interface DeleteQueueProps {
  queueName: string
  visible: boolean
  onClose: () => void
}

export const DeleteQueue = ({ queueName, visible, onClose }: DeleteQueueProps) => {
  const navigate = useNavigate()
  const { data: project } = useSelectedProjectQuery()

  const { mutate: deleteDatabaseQueue, isPending } = useDatabaseQueueDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed queue ${queueName}`)
      navigateToUrl(navigate, `/project/${project?.ref}/integrations/queues/queues`)
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
      loading={isPending}
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
