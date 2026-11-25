import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/pipelines-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Pipelines Logs' },
})

function LogPage() {
  const { ref } = useParams()

  return <LogsPreviewer condensedLayout queryType="pipelines" projectRef={ref!} />
}
