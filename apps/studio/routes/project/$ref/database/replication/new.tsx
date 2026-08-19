import { createFileRoute } from '@tanstack/react-router'

import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import DatabaseReplicationNewPage from '@/pages/project/[ref]/database/replication/new'

export const Route = createFileRoute('/project/$ref/database/replication/new')({
  component: DatabaseReplicationNewRoute,
  staticData: {
    skipDatabaseLayout: true,
  },
})

function DatabaseReplicationNewRoute() {
  return (
    <ProjectLayoutWithAuth
      product="Database"
      browserTitle={{ section: 'Create pipeline' }}
      isBlocking={false}
    >
      <DatabaseReplicationNewPage dehydratedState={undefined} />
    </ProjectLayoutWithAuth>
  )
}
