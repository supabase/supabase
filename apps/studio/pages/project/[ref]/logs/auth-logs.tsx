import { PermissionAction } from '@supabase/shared-types/out/constants'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const LogsPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()

  const canReadAuthLogs = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  return !canReadAuthLogs ? (
    <NoPermission isFullPage resourceText="access your project's authentication logs" />
  ) : (
    <>{project && <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />}</>
  )
}

LogsPage.getLayout = (page) => <LogsLayout title="Auth Logs">{page}</LogsLayout>

export default LogsPage
