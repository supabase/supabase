import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/postgres-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Postgres Logs' },
})

function LogPage() {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)

  return (
    <LogsPreviewer
      condensedLayout
      queryType="database"
      projectRef={ref as string}
      tableName={LogsTableName.POSTGRES}
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}
