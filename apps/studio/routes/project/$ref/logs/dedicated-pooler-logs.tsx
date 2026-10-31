import { createFileRoute } from '@tanstack/react-router'

import DedicatedPoolerLogsPage from '@/pages/project/[ref]/logs/dedicated-pooler-logs'

export const Route = createFileRoute('/project/$ref/logs/dedicated-pooler-logs')({
  component: DedicatedPoolerLogsRoute,
  staticData: { logsLayoutTitle: 'Dedicated Pooler Logs' },
})

function DedicatedPoolerLogsRoute() {
  return <DedicatedPoolerLogsPage dehydratedState={undefined} />
}
