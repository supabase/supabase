import { createFileRoute, Outlet } from '@tanstack/react-router'

import { PipelineClusterScope } from '@/components/interfaces/Database/Replication/PipelineClusterScope'

export const Route = createFileRoute('/project/$ref/database/pipelines')({
  component: PipelinesShell,
  staticData: {
    databaseLayoutTitle: 'Pipelines',
  },
})

function PipelinesShell() {
  return (
    <PipelineClusterScope>
      <Outlet />
    </PipelineClusterScope>
  )
}
