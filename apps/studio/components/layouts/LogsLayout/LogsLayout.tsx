import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import NoPermission from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { withAuth } from '@/hooks/misc/withAuth'

interface LogsLayoutProps {
  title: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )

  if (!canUseLogsExplorer) {
    if (isLoading) {
      return (
        <ProjectLayout isLoading product="Logs & Analytics" browserTitle={{ section: title }} />
      )
    }

    if (!isLoading && !canUseLogsExplorer) {
      return (
        <ProjectLayout product="Logs & Analytics" browserTitle={{ section: title }}>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  return (
    <ProjectLayout
      product="Logs & Analytics"
      browserTitle={{ section: title }}
      productMenu={<LogsSidebarMenuV2 />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
