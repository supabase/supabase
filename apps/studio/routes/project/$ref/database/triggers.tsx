import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'

import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useGrant } from '@/lib/grants'

export const Route = createFileRoute('/project/$ref/database/triggers')({
  component: TriggersShell,
  staticData: {
    databaseLayoutTitle: 'Triggers',
  },
})

const navigationItems = [
  { label: 'Data', to: '/project/$ref/database/triggers/data' },
  { label: 'Event', to: '/project/$ref/database/triggers/event' },
] as const

function TriggersShell() {
  const { ref } = Route.useParams()
  const pathname = useLocation({ select: (state) => state.pathname })
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
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Triggers</PageHeaderTitle>
            <PageHeaderDescription>
              Execute actions automatically when database events occur
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageNav size="large">
        <NavMenu>
          {navigationItems.map((item) => (
            <NavMenuItem key={item.label} active={pathname === item.to.replace('$ref', ref)}>
              <Link to={item.to} params={{ ref }}>
                {item.label}
              </Link>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>
      <Outlet />
    </>
  )
}
