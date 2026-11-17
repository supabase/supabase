import { createFileRoute } from '@tanstack/react-router'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const Route = createFileRoute('/project/$ref/logs/auth-logs')({
  component: LogsPage,
  staticData: { logsLayoutTitle: 'Auth Logs' },
})

function LogsPage() {
  const { data: project } = useSelectedProjectQuery()
  const { can: canReadAuthLogs, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.ANALYTICS_LOGS_READ
  )

  if (!isPermissionsLoaded) return null

  if (!canReadAuthLogs) {
    return <NoPermission isFullPage resourceText="access your project's authentication logs" />
  }

  return !!project ? (
    <LogsPreviewer condensedLayout projectRef={project.ref} queryType="auth" />
  ) : null
}
