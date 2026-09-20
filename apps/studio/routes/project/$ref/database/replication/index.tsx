import { createFileRoute } from '@tanstack/react-router'

import DatabaseReplicationPage from '@/pages/project/[ref]/database/replication/index'

export const Route = createFileRoute('/project/$ref/database/replication/')({
  component: DatabaseReplicationIndexRoute,
})

function DatabaseReplicationIndexRoute() {
  return <DatabaseReplicationPage dehydratedState={undefined} />
}
