import { PermissionAction } from '@supabase/shared-types/out/constants'

import { DeleteHookModal } from '@/components/interfaces/Database/Hooks/DeleteHookModal'
import { EditHookPanel } from '@/components/interfaces/Database/Hooks/EditHookPanel'
import { HooksList } from '@/components/interfaces/Database/Hooks/HooksList/HooksList'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const WebhooksListTab = () => {
  const { can: canReadWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  if (isPermissionsLoaded && !canReadWebhooks) {
    return <NoPermission isFullPage resourceText="view database webhooks" />
  }

  return (
    <div className="p-10">
      <HooksList />
      <EditHookPanel />
      <DeleteHookModal />
    </div>
  )
}
