import { createFileRoute } from '@tanstack/react-router'

import LogsSavedPage from '@/pages/project/[ref]/logs/explorer/saved'

export const Route = createFileRoute('/project/$ref/logs/explorer/saved')({
  component: LogsExplorerSavedRoute,
  staticData: { logsLayoutTitle: 'Saved' },
})

function LogsExplorerSavedRoute() {
  return <LogsSavedPage dehydratedState={undefined} />
}
