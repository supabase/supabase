import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { withAuth } from 'hooks/misc/withAuth'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckProjectPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )

  const router = useRouter()
  const [_, setLastLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    router.pathname.split('/logs/')[1]
  )

  useEffect(() => {
    if (router.pathname.includes('/logs/')) {
      const path = router.pathname.split('/logs/')[1]
      setLastLogsPage(path)
    }
  }, [router, setLastLogsPage])

  if (!canUseLogsExplorer) {
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
