import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const canUseLogsExplorer = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  if (!canUseLogsExplorer) {
    return (
      <ProjectLayout>
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's logs explorer" />
        </main>
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout title={title} product="Logs & Analytics" productMenu={<LogsSidebarMenuV2 />}>
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
