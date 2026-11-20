import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { LogoLoader } from 'ui'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useSupavisorConfigurationQuery } from '@/data/database/supavisor-configuration-query'

export const Route = createFileRoute('/project/$ref/logs/pooler-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Pooler Logs' },
})

function LogPage() {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)
  const { isPending: isLoading } = useSupavisorConfigurationQuery({ projectRef: ref ?? 'default' })

  // this prevents initial load of pooler logs before config has been retrieved
  if (isLoading) return <LogoLoader />

  return (
    <LogsPreviewer
      condensedLayout
      queryType="supavisor"
      projectRef={ref as string}
      tableName={LogsTableName.SUPAVISOR}
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}
