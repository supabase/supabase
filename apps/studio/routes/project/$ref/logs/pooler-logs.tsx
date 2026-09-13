import { createFileRoute } from '@tanstack/react-router'

import PoolerLogsPage from '@/pages/project/[ref]/logs/pooler-logs'

export const Route = createFileRoute('/project/$ref/logs/pooler-logs')({
  component: PoolerLogsRoute,
  staticData: { logsLayoutTitle: 'Pooler Logs' },
})

function PoolerLogsRoute() {
  return <PoolerLogsPage dehydratedState={undefined} />
}
