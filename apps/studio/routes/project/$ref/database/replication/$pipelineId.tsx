import { createFileRoute } from '@tanstack/react-router'

import DatabaseReplicationPage from '@/pages/project/[ref]/database/replication/[pipelineId]'

export const Route = createFileRoute('/project/$ref/database/replication/$pipelineId')({
  component: DatabaseReplicationPipelineRoute,
  staticData: {
    databaseLayoutTitle: 'Replication',
  },
})

function DatabaseReplicationPipelineRoute() {
  return <DatabaseReplicationPage dehydratedState={undefined} />
}
