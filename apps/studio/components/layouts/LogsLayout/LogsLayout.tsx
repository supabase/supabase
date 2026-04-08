import { PermissionAction } from '@supabase/shared-types/out/constants'
import type { PropsWithChildren } from 'react'

import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayout'
import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import NoPermission from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { withAuth } from '@/hooks/misc/withAuth'

interface LogsLayoutProps {
  title: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const isNavigationV2 = useIsNavigationV2Enabled()
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )

  if (!canUseLogsExplorer) {
    if (isLoading) {
      return isNavigationV2 ? (
        <ProjectLayoutV2 isLoading />
      ) : (
        <ProjectLayout isLoading product="Logs & Analytics" browserTitle={{ section: title }} />
      )
    }

    if (!isLoading && !canUseLogsExplorer) {
      return isNavigationV2 ? (
        <ProjectLayoutV2>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayoutV2>
      ) : (
        <ProjectLayout product="Logs & Analytics" browserTitle={{ section: title }}>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title={title} product="Logs & Analytics">
        {children}
      </ProjectLayoutV2>
    )
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
