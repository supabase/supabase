import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useParams } from 'common'

import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

export const Route = createFileRoute('/project/$ref/database/pipelines')({
  component: PipelinesShell,
  staticData: {
    databaseLayoutTitle: 'Pipelines',
  },
})

function PipelinesShell() {
  const { ref: projectRef } = useParams()

  return (
    <PipelineRequestStatusProvider key={projectRef}>
      <Outlet />
    </PipelineRequestStatusProvider>
  )
}
