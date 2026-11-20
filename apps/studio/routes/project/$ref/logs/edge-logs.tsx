import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/edge-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Edge Logs' },
})

function LogPage() {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)

  return (
    <LogsPreviewer
      condensedLayout
      queryType="api"
      projectRef={ref as string}
      tableName={LogsTableName.EDGE}
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}
