import { createFileRoute } from '@tanstack/react-router'

import LogsExplorerPage from '@/pages/project/[ref]/logs/explorer/index'

export const Route = createFileRoute('/project/$ref/logs/explorer/')({
  component: LogsExplorerIndexRoute,
  staticData: { logsLayoutTitle: 'Explorer' },
})

function LogsExplorerIndexRoute() {
  return <LogsExplorerPage dehydratedState={undefined} />
}
