import type { PostgresTrigger } from '@supabase/postgres-meta'

import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

interface DeleteTriggerProps {
  trigger?: PostgresTrigger
  visible: boolean
  setVisible: (value: string | null) => void
  onDelete: (params: {
    projectRef: string
    connectionString?: string | null
    trigger: PostgresTrigger
  }) => void
  isLoading: boolean
}

export const DeleteTrigger = ({
  trigger,
  visible,
  setVisible,
  onDelete,
  isLoading,
}: DeleteTriggerProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { name, schema } = trigger ?? {}

  async function handleDelete() {
    if (!project) return console.error('Project is required')
    if (!trigger) return console.error('Trigger ID is required')

    onDelete({
      projectRef: project.ref,
      connectionString: project.connectionString,
      trigger,
    })
  }

  return (
    <TextConfirmModal
      variant={'warning'}
      visible={visible}
      onCancel={() => setVisible('')}
      onConfirm={handleDelete}
      title="Delete this trigger"
      loading={isLoading}
      confirmLabel={`Delete trigger ${name}`}
      confirmPlaceholder="Type in name of trigger"
      confirmString={name ?? ''}
      text={
        <>
          This will delete your trigger called{' '}
          <span className="text-bold text-foreground">{name}</span> of schema{' '}
          <span className="text-bold text-foreground">{schema}</span>
        </>
      }
      alert={{
        title: 'You cannot recover this trigger once deleted.',
      }}
    />
  )
}
