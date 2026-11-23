import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

export const Route = createFileRoute('/project/$ref/database/pipelines')({
  component: PipelinesShell,
  staticData: {
    databaseLayoutTitle: 'Pipelines',
  },
})

function PipelinesShell() {
  const { ref: projectRef } = Route.useParams()

  return (
    <ReplicationClusterProvider clusterId={undefined}>
      <PipelineRequestStatusProvider key={projectRef}>
        <Outlet />
      </PipelineRequestStatusProvider>
    </ReplicationClusterProvider>
  )
}
