import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/edge-functions-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Edge Functions Logs' },
})

function LogPage() {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="fn_edge"
      projectRef={ref as string}
      tableName={LogsTableName.FN_EDGE}
    />
  )
}
