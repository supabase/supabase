import { createFileRoute } from '@tanstack/react-router'

import PgCronLogsPage from '@/pages/project/[ref]/logs/pgcron-logs'

export const Route = createFileRoute('/project/$ref/logs/pgcron-logs')({
  component: PgCronLogsRoute,
  staticData: { logsLayoutTitle: 'PgCron Logs' },
})

function PgCronLogsRoute() {
  return <PgCronLogsPage dehydratedState={undefined} />
}
