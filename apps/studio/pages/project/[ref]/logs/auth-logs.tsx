import { PermissionAction } from '@supabase/shared-types/out/constants'

import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const LogsPage: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { can: canReadAuthLogs } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
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
