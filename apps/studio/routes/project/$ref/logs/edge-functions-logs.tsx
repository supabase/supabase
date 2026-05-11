import { createFileRoute } from '@tanstack/react-router'

import EdgeFunctionsLogsPage from '@/pages/project/[ref]/logs/edge-functions-logs'

export const Route = createFileRoute('/project/$ref/logs/edge-functions-logs')({
  component: EdgeFunctionsLogsRoute,
  staticData: { logsLayoutTitle: 'Edge Functions Logs' },
})

function EdgeFunctionsLogsRoute() {
  return <EdgeFunctionsLogsPage dehydratedState={undefined} />
}
