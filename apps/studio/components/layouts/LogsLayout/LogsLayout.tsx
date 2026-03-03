import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PropsWithChildren } from 'react'
import { useRouter } from 'next/router'

import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'

interface LogsLayoutProps {
  title?: string
}

const LOGS_SECTION_TITLE_BY_ROUTE: Record<string, string> = {
  '/project/[ref]/logs/explorer': 'Explorer',
  '/project/[ref]/logs/explorer/recent': 'Recent',
  '/project/[ref]/logs/explorer/saved': 'Saved',
  '/project/[ref]/logs/explorer/templates': 'Templates',
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const router = useRouter()
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )
  const resolvedTitle = title ?? LOGS_SECTION_TITLE_BY_ROUTE[router.pathname]

  if (!canUseLogsExplorer) {
    if (isLoading) {
      return (
        <ProjectLayout isLoading title={resolvedTitle} product="Logs & Analytics"></ProjectLayout>
      )
    }

    if (!isLoading && !canUseLogsExplorer) {
      return (
        <ProjectLayout title={resolvedTitle} product="Logs & Analytics">
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  return (
    <ProjectLayout
      title={resolvedTitle}
      product="Logs & Analytics"
      productMenu={<LogsSidebarMenuV2 />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
