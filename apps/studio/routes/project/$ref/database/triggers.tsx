import { createFileRoute, Outlet } from '@tanstack/react-router'

import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissionsV2, FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'

export const Route = createFileRoute('/project/$ref/database/triggers')({
  component: TriggersShell,
  staticData: {
    databaseLayoutTitle: 'Triggers',
  },
})

function TriggersShell() {
  const { ref } = Route.useParams()
  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_READ
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
