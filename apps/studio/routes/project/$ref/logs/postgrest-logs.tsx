import { createFileRoute } from '@tanstack/react-router'

import PostgrestLogsPage from '@/pages/project/[ref]/logs/postgrest-logs'

export const Route = createFileRoute('/project/$ref/logs/postgrest-logs')({
  component: PostgrestLogsRoute,
  staticData: { logsLayoutTitle: 'Postgrest Logs' },
})

function PostgrestLogsRoute() {
  return <PostgrestLogsPage dehydratedState={undefined} />
}
