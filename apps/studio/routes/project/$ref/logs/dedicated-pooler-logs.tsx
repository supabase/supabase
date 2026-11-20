import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LogoLoader } from 'ui'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

export const Route = createFileRoute('/project/$ref/logs/dedicated-pooler-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Dedicated Pooler Logs' },
})

function LogPage() {
  const navigate = useNavigate()
  const { ref } = Route.useParams()
  const { hasAccess: hasDedicatedPooler, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('dedicated_pooler')

  useEffect(() => {
    // Redirect to pooler logs if org is not entitled to dedicated pooler
    if (!isLoadingEntitlement && !hasDedicatedPooler) {
      void navigate({ to: '/project/$ref/logs/pooler-logs', params: { ref } })
    }
  }, [hasDedicatedPooler, isLoadingEntitlement, ref, navigate])

  // Prevent showing logs while checking entitlement
  if (isLoadingEntitlement || !hasDedicatedPooler) {
    return <LogoLoader />
  }

  return (
    <LogsPreviewer
      projectRef={ref}
      condensedLayout={true}
      tableName={LogsTableName.PGBOUNCER}
      queryType={'pgbouncer'}
    />
  )
}
