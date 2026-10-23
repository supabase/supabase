import { createFileRoute } from '@tanstack/react-router'

import PostgresLogsPage from '@/pages/project/[ref]/logs/postgres-logs'

export const Route = createFileRoute('/project/$ref/logs/postgres-logs')({
  component: PostgresLogsRoute,
  staticData: { logsLayoutTitle: 'Postgres Logs' },
})

function PostgresLogsRoute() {
  return <PostgresLogsPage dehydratedState={undefined} />
}
