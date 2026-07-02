import { createFileRoute } from '@tanstack/react-router'

import DatabaseReplicationPage from '@/pages/project/[ref]/database/replication/index'

export const Route = createFileRoute('/project/$ref/database/replication/')({
  component: DatabaseReplicationIndexRoute,
  staticData: {
    databaseLayoutTitle: 'Replication',
  },
})

function DatabaseReplicationIndexRoute() {
  return <DatabaseReplicationPage dehydratedState={undefined} />
}
