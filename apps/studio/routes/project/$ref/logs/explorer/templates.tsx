import { createFileRoute } from '@tanstack/react-router'

import LogsTemplatesPage from '@/pages/project/[ref]/logs/explorer/templates'

export const Route = createFileRoute('/project/$ref/logs/explorer/templates')({
  component: LogsExplorerTemplatesRoute,
  staticData: { logsLayoutTitle: 'Templates' },
})

function LogsExplorerTemplatesRoute() {
  return <LogsTemplatesPage dehydratedState={undefined} />
}
