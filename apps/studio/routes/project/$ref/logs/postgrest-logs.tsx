import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsTableEmptyState } from '@/components/interfaces/Settings/Logs/LogsTableEmptyState'

export const Route = createFileRoute('/project/$ref/logs/postgrest-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Postgrest Logs' },
})

function LogPage() {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)

  return (
    <LogsPreviewer
      condensedLayout
      queryType="postgrest"
      projectRef={ref as string}
      tableName={LogsTableName.POSTGREST}
      EmptyState={
        <LogsTableEmptyState
          title="No results found"
          description="Only errors are captured into PostgREST logs by default. Check the API Gateway logs for HTTP requests."
        />
      }
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}
