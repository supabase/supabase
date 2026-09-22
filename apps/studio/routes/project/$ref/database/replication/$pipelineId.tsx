import { createFileRoute } from '@tanstack/react-router'

import DatabaseReplicationPage from '@/pages/project/[ref]/database/replication/[pipelineId]'

export const Route = createFileRoute('/project/$ref/database/replication/$pipelineId')({
  component: DatabaseReplicationPipelineRoute,
})

function DatabaseReplicationPipelineRoute() {
  return <DatabaseReplicationPage dehydratedState={undefined} />
}
