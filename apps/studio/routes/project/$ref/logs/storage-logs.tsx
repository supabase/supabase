import { createFileRoute } from '@tanstack/react-router'

import StorageLogsPage from '@/pages/project/[ref]/logs/storage-logs'

export const Route = createFileRoute('/project/$ref/logs/storage-logs')({
  component: StorageLogsRoute,
  staticData: { logsLayoutTitle: 'Storage Logs' },
})

function StorageLogsRoute() {
  return <StorageLogsPage dehydratedState={undefined} />
}
