import { createFileRoute } from '@tanstack/react-router'

import DatabaseReplicationSettingsPage from '@/pages/project/[ref]/database/replication/[pipelineId]/settings'

export const Route = createFileRoute('/project/$ref/database/replication/$pipelineId/settings')({
  component: DatabaseReplicationSettingsRoute,
  staticData: {
    databaseLayoutTitle: 'Replication',
  },
})

function DatabaseReplicationSettingsRoute() {
  return <DatabaseReplicationSettingsPage dehydratedState={undefined} />
}
