import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/pg-upgrade-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Postgres Version Upgrade' },
})

function LogPage() {
  const { ref } = useParams()
  return <LogsPreviewer condensedLayout queryType="pg_upgrade" projectRef={ref as string} />
}
