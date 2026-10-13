import { createFileRoute } from '@tanstack/react-router'

import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import DatabasePipelinesNewPage from '@/pages/project/[ref]/database/pipelines/new'

export const Route = createFileRoute('/project/$ref/database/pipelines/new')({
  component: DatabasePipelinesNewRoute,
  staticData: {
    skipDatabaseLayout: true,
  },
})

function DatabasePipelinesNewRoute() {
  return (
    <ProjectLayoutWithAuth
      product="Database"
      browserTitle={{ section: 'New Pipeline' }}
      isBlocking={false}
    >
      <DatabasePipelinesNewPage dehydratedState={undefined} />
    </ProjectLayoutWithAuth>
  )
}
