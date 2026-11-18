import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/storage-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Storage Logs' },
})

function LogPage() {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      // @ts-ignore
      tableName={'storage_logs'}
      queryType={'storage'}
    />
  )
}
