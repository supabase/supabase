import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { LogsLayout } from 'components/layouts'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import NoPermission from 'components/ui/NoPermission'

const LogsPage: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  const canReadAuthLogs = checkPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  return !canReadAuthLogs ? (
    <NoPermission isFullPage resourceText="access your project's authentication logs" />
  ) : (
    <>{project && <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />}</>
  )
}

LogsPage.getLayout = (page) => <LogsLayout title="Auth Logs">{page}</LogsLayout>

export default observer(LogsPage)
