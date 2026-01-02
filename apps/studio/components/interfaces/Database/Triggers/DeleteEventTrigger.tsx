import type { DatabaseEventTrigger } from 'data/database-event-triggers/database-event-triggers-query'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'

interface DeleteEventTriggerProps {
  trigger?: DatabaseEventTrigger
  visible: boolean
  onCancel: () => void
  onDelete: () => void
  isLoading: boolean
}

export const DeleteEventTrigger = ({
  trigger,
  visible,
  onCancel,
  onDelete,
  isLoading,
}: DeleteEventTriggerProps) => {
  const name = trigger?.name ?? ''

  return (
    <TextConfirmModal
      variant="warning"
      visible={visible}
      onCancel={onCancel}
      onConfirm={onDelete}
      title="Delete this event trigger"
      loading={isLoading}
      confirmLabel={`Delete trigger ${name}`}
      confirmPlaceholder="Type in name of trigger"
      confirmString={name}
      text={
        <>
          This will delete your event trigger called{' '}
          <span className="text-bold text-foreground">{name}</span>.
        </>
      }
      alert={{
        title: 'You cannot recover this event trigger once deleted.',
      }}
    />
  )
}
