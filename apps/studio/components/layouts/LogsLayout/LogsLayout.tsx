import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren, useEffect } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import { useRouter } from 'next/router'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useParams } from 'common'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const canUseLogsExplorer = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')
  const { ref } = useParams()

  const router = useRouter()
  const [lastLogsPage, setLastLogsPage] = useLocalStorageQuery(
    'supabase-last-logs-page',
    router.pathname
  )

  useEffect(() => {
    if (router.pathname.includes('/logs/')) {
      setLastLogsPage(router.pathname)
    }
  }, [router, setLastLogsPage])

  useEffect(() => {
    const last5chars = router.pathname.slice(-5)
    if (last5chars === '/logs' && lastLogsPage) {
      router.push({
        pathname: lastLogsPage,
        query: { ref },
      })
    }
  }, [router, lastLogsPage, ref])

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
