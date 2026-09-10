import { createFileRoute } from '@tanstack/react-router'

import MultigresLogsPage from '@/pages/project/[ref]/logs/multigres-logs'

export const Route = createFileRoute('/project/$ref/logs/multigres-logs')({
  component: MultigresLogsRoute,
  staticData: { logsLayoutTitle: 'Multigres Logs' },
})

function MultigresLogsRoute() {
  return <MultigresLogsPage dehydratedState={undefined} />
}
