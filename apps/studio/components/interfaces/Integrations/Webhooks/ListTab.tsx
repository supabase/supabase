import { useParams } from 'common'

import { DeleteHookModal } from '@/components/interfaces/Database/Hooks/DeleteHookModal'
import { EditHookPanel } from '@/components/interfaces/Database/Hooks/EditHookPanel'
import { HooksList } from '@/components/interfaces/Database/Hooks/HooksList/HooksList'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useGrant } from '@/lib/grants'

export const WebhooksListTab = () => {
  const { ref } = useParams()
  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: ref },
    { variant: 'read' }
  )

  if (readGrant.status === 'denied') {
    return (
      <ConstrainedIntegrationTabScaffold>
        <NoPermission isFullPage resourceText="view database webhooks" />
      </ConstrainedIntegrationTabScaffold>
    )
  }

  if (readGrant.status === 'error') {
    return (
      <ConstrainedIntegrationTabScaffold>
        <AlertError
          error={readGrant.error}
          subject="Failed to check database webhooks permissions"
        />
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
