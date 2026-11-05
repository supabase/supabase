import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import LogsLayout from '@/components/layouts/LogsLayout/LogsLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const LogsPage: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { can: canReadAuthLogs } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.ANALYTICS_LOGS_READ
  )

  return !canReadAuthLogs ? (
    <NoPermission isFullPage resourceText="access your project's authentication logs" />
  ) : !!project ? (
    <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />
  ) : null
}

LogsPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Auth Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsPage
