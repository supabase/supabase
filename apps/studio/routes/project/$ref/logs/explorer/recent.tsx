import { createFileRoute } from '@tanstack/react-router'

import LogsRecentPage from '@/pages/project/[ref]/logs/explorer/recent'

export const Route = createFileRoute('/project/$ref/logs/explorer/recent')({
  component: LogsExplorerRecentRoute,
  staticData: { logsLayoutTitle: 'Recent' },
})

function LogsExplorerRecentRoute() {
  return <LogsRecentPage dehydratedState={undefined} />
}
