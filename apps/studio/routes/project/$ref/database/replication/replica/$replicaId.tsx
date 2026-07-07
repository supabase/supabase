import { createFileRoute } from '@tanstack/react-router'

import DatabaseReadReplicaPage from '@/pages/project/[ref]/database/replication/replica/[replicaId]'

export const Route = createFileRoute('/project/$ref/database/replication/replica/$replicaId')({
  component: DatabaseReplicationReplicaRoute,
  staticData: {
    databaseLayoutTitle: 'Replication',
  },
})

function DatabaseReplicationReplicaRoute() {
  return <DatabaseReadReplicaPage dehydratedState={undefined} />
}
