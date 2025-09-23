import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import DeleteHookModal from 'components/interfaces/Database/Hooks/DeleteHookModal'
import { EditHookPanel } from 'components/interfaces/Database/Hooks/EditHookPanel'
import { HooksList } from 'components/interfaces/Database/Hooks/HooksList/HooksList'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const WebhooksListTab = () => {
  const [selectedHook, setSelectedHook] = useState<any>()
  const [showCreateHookForm, setShowCreateHookForm] = useState<boolean>(false)
  const [showDeleteHookForm, setShowDeleteHookForm] = useState<boolean>(false)

  const { can: canReadWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const createHook = () => {
    setSelectedHook(undefined)
    setShowCreateHookForm(true)
  }

  const editHook = (hook: PostgresTrigger) => {
    setSelectedHook(hook)
    setShowCreateHookForm(true)
  }

  const deleteHook = (hook: PostgresTrigger) => {
    setSelectedHook(hook)
    setShowDeleteHookForm(true)
  }

  if (isPermissionsLoaded && !canReadWebhooks) {
    return <NoPermission isFullPage resourceText="view database webhooks" />
  }

  return (
    <div className="p-10">
      <HooksList createHook={createHook} editHook={editHook} deleteHook={deleteHook} />
      <EditHookPanel
        key={selectedHook?.id}
        visible={showCreateHookForm}
        selectedHook={selectedHook}
        onClose={() => setShowCreateHookForm(false)}
      />
      <DeleteHookModal
        visible={showDeleteHookForm}
        selectedHook={selectedHook}
        onClose={() => setShowDeleteHookForm(false)}
      />
    </div>
  )
}
