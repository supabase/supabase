import { PermissionAction } from '@supabase/shared-types/out/constants'
import { createFileRoute, Outlet } from '@tanstack/react-router'

import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const Route = createFileRoute('/project/$ref/database/triggers')({
  component: TriggersShell,
  staticData: {
    databaseLayoutTitle: 'Triggers',
  },
})

function TriggersShell() {
  const { ref } = Route.useParams()
  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  if (isPermissionsLoaded && !canReadTriggers) {
    return <NoPermission isFullPage resourceText="view database triggers" />
  }

  return (
    <PageLayout
      title="Database Triggers"
      subtitle="Execute actions automatically when database events occur"
      size="large"
      navigationItems={[
        { label: 'Data', href: `/project/${ref}/database/triggers/data` },
        { label: 'Event', href: `/project/${ref}/database/triggers/event` },
      ]}
    >
      <Outlet />
    </PageLayout>
  )
}
