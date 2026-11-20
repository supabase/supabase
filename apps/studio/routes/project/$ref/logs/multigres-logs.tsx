import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/multigres-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Multigres Logs' },
})

function LogPage() {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="multigres"
      projectRef={ref as string}
      tableName={LogsTableName.MULTIGRES}
    />
  )
}
