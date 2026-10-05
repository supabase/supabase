import { useParams } from 'common'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import { NoPermission } from '@/components/ui/NoPermission'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { withAuth } from '@/hooks/misc/withAuth'

interface LogsLayoutProps {
  title: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { ref } = useParams()
  const logsEnabled = useIsFeatureEnabled('logs:all')

  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.ANALYTICS_LOGS_READ
  )

  if (!logsEnabled) {
    return (
      <ProjectLayout product="Logs" browserTitle={{ section: title }}>
        <UnknownInterface urlBack={`/project/${ref}`} />
      </ProjectLayout>
    )
  }

  if (!canUseLogsExplorer) {
    if (isLoading) {
      return <ProjectLayout isLoading product="Logs" browserTitle={{ section: title }} />
    }

    if (!isLoading && !canUseLogsExplorer) {
      return (
        <ProjectLayout product="Logs" browserTitle={{ section: title }}>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  return (
    <ProjectLayout
      product="Logs"
      browserTitle={{ section: title }}
      productMenu={<LogsSidebarMenuV2 />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
