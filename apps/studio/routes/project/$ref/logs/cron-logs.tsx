import { createFileRoute } from '@tanstack/react-router'

import CronLogsPage from '@/pages/project/[ref]/logs/cron-logs'

export const Route = createFileRoute('/project/$ref/logs/cron-logs')({
  component: CronLogsRoute,
  staticData: { logsLayoutTitle: 'Cron Logs' },
})

function CronLogsRoute() {
  return <CronLogsPage dehydratedState={undefined} />
}
