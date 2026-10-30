import { createFileRoute } from '@tanstack/react-router'

import RealtimeLogsPage from '@/pages/project/[ref]/logs/realtime-logs'

export const Route = createFileRoute('/project/$ref/logs/realtime-logs')({
  component: RealtimeLogsRoute,
  staticData: { logsLayoutTitle: 'Realtime Logs' },
})

function RealtimeLogsRoute() {
  return <RealtimeLogsPage dehydratedState={undefined} />
}
