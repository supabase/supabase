import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PropsWithChildren } from 'react'

import { useProfile } from '@/lib/profile'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { isSupportAccount, isLoading: isLoadingProfile } = useProfile()
  const { isLoading: isLoadingPermissions, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )
  const isLoading = isLoadingProfile || isLoadingPermissions

  if (!isSupportAccount && !canUseLogsExplorer) {
    if (isLoading) {
      return <ProjectLayout isLoading></ProjectLayout>
    }
    if (!isLoading && !canUseLogsExplorer) {
      return (
        <ProjectLayout>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  return (
    <ProjectLayout title={title} product="Logs & Analytics" productMenu={<LogsSidebarMenuV2 />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
