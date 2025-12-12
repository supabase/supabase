import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef } from 'react'
import { toast } from 'sonner'

import DeleteHookModal from 'components/interfaces/Database/Hooks/DeleteHookModal'
import { EditHookPanel } from 'components/interfaces/Database/Hooks/EditHookPanel'
import { HooksList } from 'components/interfaces/Database/Hooks/HooksList/HooksList'
import NoPermission from 'components/ui/NoPermission'
import { useDatabaseHooksQuery } from 'data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { handleErrorOnDelete, useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export const WebhooksListTab = () => {
  const { data: project } = useSelectedProjectQuery()

  // Track the ID being deleted to exclude it from error checking
  const deletingHookIdRef = useRef<string | null>(null)

  const [showCreateHookForm, setShowCreateHookForm] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { can: canReadWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const { data: hooks, isPending: isLoadingHooks } = useDatabaseHooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { setValue: setSelectedHookToEdit, value: selectedHookToEdit } = useQueryStateWithSelect({
    urlKey: 'edit',
    select: (id: string) => (id ? hooks?.find((hook) => hook.id.toString() === id) : undefined),
    enabled: !!hooks && !isLoadingHooks,
    onError: () => toast.error(`Webhook not found`),
  })

  const { setValue: setSelectedHookToDelete, value: selectedHookToDelete } =
    useQueryStateWithSelect({
      urlKey: 'delete',
      select: (id: string) => (id ? hooks?.find((hook) => hook.id.toString() === id) : undefined),
      enabled: !!hooks && !isLoadingHooks,
      onError: (_error, selectedId) =>
        handleErrorOnDelete(deletingHookIdRef, selectedId, `Webhook not found`),
    })

  const createHook = () => {
    setShowCreateHookForm(true)
  }

  const editHook = (hook: PostgresTrigger) => {
    setSelectedHookToEdit(hook.id.toString())
  }

  const deleteHook = (hook: PostgresTrigger) => {
    setSelectedHookToDelete(hook.id.toString())
  }

  if (isPermissionsLoaded && !canReadWebhooks) {
    return <NoPermission isFullPage resourceText="view database webhooks" />
  }

  return (
    <div className="p-10">
      <HooksList createHook={createHook} editHook={editHook} deleteHook={deleteHook} />
      <EditHookPanel
        key={selectedHookToEdit?.id}
        visible={showCreateHookForm || !!selectedHookToEdit}
        selectedHook={selectedHookToEdit}
        onClose={() => {
          setShowCreateHookForm(false)
          setSelectedHookToEdit(null)
        }}
      />
      <DeleteHookModal
        visible={!!selectedHookToDelete}
        selectedHook={selectedHookToDelete}
        onClose={() => {
          deletingHookIdRef.current = null
          setSelectedHookToDelete(null)
        }}
        onDeleteStart={(hookId: string) => {
          deletingHookIdRef.current = hookId
        }}
      />
    </div>
  )
}
