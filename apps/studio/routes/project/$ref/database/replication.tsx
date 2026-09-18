import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useParams } from 'common'

import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

export const Route = createFileRoute('/project/$ref/database/replication')({
  component: ReplicationShell,
  staticData: {
    databaseLayoutTitle: 'Replication',
  },
})

function ReplicationShell() {
  const { ref: projectRef } = useParams()

  return (
    <PipelineRequestStatusProvider key={projectRef}>
      <Outlet />
    </PipelineRequestStatusProvider>
  )
}
