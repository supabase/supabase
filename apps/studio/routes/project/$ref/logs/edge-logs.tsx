import { createFileRoute } from '@tanstack/react-router'

import EdgeLogsPage from '@/pages/project/[ref]/logs/edge-logs'

export const Route = createFileRoute('/project/$ref/logs/edge-logs')({
  component: EdgeLogsRoute,
  staticData: { logsLayoutTitle: 'Edge Logs' },
})

function EdgeLogsRoute() {
  return <EdgeLogsPage dehydratedState={undefined} />
}
