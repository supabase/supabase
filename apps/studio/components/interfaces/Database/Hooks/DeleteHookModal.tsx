import { useQuery } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useDatabaseTriggerDeleteMutation } from '@/data/database-triggers/database-trigger-delete-mutation'
import { databaseHooksQueryOptions } from '@/data/database-triggers/database-triggers-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getWriteGrantToastMessage, useGrant } from '@/lib/grants'

export const DeleteHookModal = () => {
  const { data: project } = useSelectedProjectQuery()

  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'read' }
  )
  const writeGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'write' }
  )

  const { data: hooks = [], isSuccess } = useQuery(
    databaseHooksQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      grant: readGrant.grant,
    })
  )

  const [selectedHookIdToDelete, setSelectedHookIdToDelete] = useQueryState(
    'delete',
    parseAsString.withDefault('')
  )
  const selectedHook = hooks.find((hook) => hook.id.toString() === selectedHookIdToDelete)
  const { name, schema } = selectedHook ?? {}

  const {
    mutate: deleteDatabaseTrigger,
    isPending: isDeleting,
    isSuccess: isSuccessDelete,
  } = useDatabaseTriggerDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${name}`)
      setSelectedHookIdToDelete(null)
    },
  })

  async function handleDelete() {
    if (!project) return console.error('Project ref is required')
    if (!selectedHook) return toast.error('Unable to find selected hook')
    if (!writeGrant.grant) {
      return toast.error(getWriteGrantToastMessage(writeGrant.status, 'delete', 'webhooks'))
    }

    deleteDatabaseTrigger({
      grant: writeGrant.grant,
      trigger: selectedHook,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  useEffect(() => {
    if (isSuccess && !!selectedHookIdToDelete && !selectedHook && !isSuccessDelete) {
      toast('Webhook not found')
      setSelectedHookIdToDelete(null)
    }
  }, [isSuccess, isSuccessDelete, selectedHook, selectedHookIdToDelete, setSelectedHookIdToDelete])

  return (
    <TextConfirmModal
      variant="destructive"
      visible={!!selectedHook}
      size="small"
      onCancel={() => setSelectedHookIdToDelete(null)}
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
