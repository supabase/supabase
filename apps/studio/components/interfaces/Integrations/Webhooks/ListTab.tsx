import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useMemo, useRef } from 'react'

import DeleteHookModal from '@/components/interfaces/Database/Hooks/DeleteHookModal'
import { EditHookPanel } from '@/components/interfaces/Database/Hooks/EditHookPanel'
import { HooksList } from '@/components/interfaces/Database/Hooks/HooksList/HooksList'
import NoPermission from '@/components/ui/NoPermission'
import { useDatabaseHooksQuery } from '@/data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { handleErrorOnDelete, useQueryStateWithSelect } from '@/hooks/misc/useQueryStateWithSelect'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const WebhooksListTab = () => {
  const { data: project } = useSelectedProjectQuery()

  // Track the ID being deleted to exclude it from error checking
  const deletingHookIdRef = useRef<string | null>(null)

  const [showCreateHookForm, setShowCreateHookForm] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const [selectedHookIdToEdit, setSelectedHookIdToEdit] = useQueryState(
    'edit',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const { can: canReadWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const { data: hooks, isPending: isLoadingHooks } = useDatabaseHooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
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
    setSelectedHookIdToEdit(hook.id.toString())
  }

  const deleteHook = (hook: PostgresTrigger) => {
    setSelectedHookToDelete(hook.id.toString())
  }

  const selectedHookToEdit = useMemo(
    () => hooks?.find((hook) => hook.id.toString() === selectedHookIdToEdit),
    [hooks, selectedHookIdToEdit]
  )

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
          setSelectedHookIdToEdit('')
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
