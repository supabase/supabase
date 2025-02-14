import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren, useEffect } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import { useRouter } from 'next/router'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const canUseLogsExplorer = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  const router = useRouter()
  const [lastLogsPage, setLastLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    router.pathname.split('/').pop()
  )

  useEffect(() => {
    if (router.pathname.includes('/logs/')) {
      const path = router.pathname.split('/').pop()
      setLastLogsPage(path)
    }
  }, [router, setLastLogsPage])

  if (!canUseLogsExplorer) {
    return (
      <ProjectLayout>
        <NoPermission isFullPage resourceText="access your project's logs explorer" />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout title={title} product="Logs & Analytics" productMenu={<LogsSidebarMenuV2 />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
