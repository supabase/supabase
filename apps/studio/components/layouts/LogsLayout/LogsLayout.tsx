import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import { useProfile } from 'lib/profile'

interface LogsLayoutProps {
  title?: string
}

/**
 * Check if the logged-in user has a @supabase.io email address.
 * Internal Supabase users can bypass certain API restrictions.
 */
function isSupabaseInternalUser(profile?: any): boolean {
  if (!profile?.primary_email) return false
  return profile.primary_email.toLowerCase().endsWith('@supabase.io')
}


const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )
  const { profile } = useProfile()

  if (!canUseLogsExplorer && !isSupabaseInternalUser(profile)) {
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
    <ProjectLayout title={title} isBlocking={false} product="Logs & Analytics" productMenu={<LogsSidebarMenuV2 isSupabaseInternalUser={isSupabaseInternalUser(profile)} />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
