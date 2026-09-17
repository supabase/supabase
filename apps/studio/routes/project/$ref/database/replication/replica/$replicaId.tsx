import { createFileRoute } from '@tanstack/react-router'

import DatabaseReadReplicaRedirectPage from '@/pages/project/[ref]/database/replication/replica/[replicaId]'

export const Route = createFileRoute('/project/$ref/database/replication/replica/$replicaId')({
  component: DatabaseReplicationReplicaRoute,
})

function DatabaseReplicationReplicaRoute() {
  return <DatabaseReadReplicaRedirectPage dehydratedState={undefined} />
}
