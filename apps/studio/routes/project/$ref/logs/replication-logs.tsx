import { createFileRoute } from '@tanstack/react-router'

import ReplicationLogsPage from '@/pages/project/[ref]/logs/replication-logs'

export const Route = createFileRoute('/project/$ref/logs/replication-logs')({
  component: ReplicationLogsRoute,
  staticData: { logsLayoutTitle: 'Replication Logs' },
})

function ReplicationLogsRoute() {
  return <ReplicationLogsPage dehydratedState={undefined} />
}
