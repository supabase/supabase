import { createFileRoute, Outlet } from '@tanstack/react-router'

import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useGrant } from '@/lib/grants'

export const Route = createFileRoute('/project/$ref/database/triggers')({
  component: TriggersShell,
  staticData: {
    databaseLayoutTitle: 'Triggers',
  },
})

function TriggersShell() {
  const { ref } = Route.useParams()
  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: ref },
    { variant: 'read' }
  )

  if (readGrant.status === 'denied') {
    return <NoPermission isFullPage resourceText="view database triggers" />
  }

  if (readGrant.status === 'error') {
    return (
      <AlertError error={readGrant.error} subject="Failed to check database triggers permissions" />
    )
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
