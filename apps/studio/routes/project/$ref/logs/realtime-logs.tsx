import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/realtime-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Realtime Logs' },
})

function LogPage() {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      // @ts-ignore
      tableName={'realtime_logs'}
      queryType={'realtime'}
    />
  )
}
