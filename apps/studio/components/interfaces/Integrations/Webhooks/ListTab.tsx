import { DeleteHookModal } from '@/components/interfaces/Database/Hooks/DeleteHookModal'
import { EditHookPanel } from '@/components/interfaces/Database/Hooks/EditHookPanel'
import { HooksList } from '@/components/interfaces/Database/Hooks/HooksList/HooksList'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const WebhooksListTab = () => {
  const { can: canReadWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_READ,
  )

  if (isPermissionsLoaded && !canReadWebhooks) {
    return (
      <ConstrainedIntegrationTabScaffold>
        <NoPermission isFullPage resourceText="view database webhooks" />
      </ConstrainedIntegrationTabScaffold>
    )
  }

  return (
    <ConstrainedIntegrationTabScaffold>
      <HooksList />
      <EditHookPanel />
      <DeleteHookModal />
    </ConstrainedIntegrationTabScaffold>
  )
}
