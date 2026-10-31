import { createFileRoute } from '@tanstack/react-router'

import PipelinesLogsPage from '@/pages/project/[ref]/logs/pipelines-logs'

export const Route = createFileRoute('/project/$ref/logs/pipelines-logs')({
  component: PipelinesLogsRoute,
  staticData: { logsLayoutTitle: 'Pipelines logs' },
})

function PipelinesLogsRoute() {
  return <PipelinesLogsPage dehydratedState={undefined} />
}
