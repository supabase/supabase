import { createFileRoute } from '@tanstack/react-router'

import DatabasePipelinesPage from '@/pages/project/[ref]/database/pipelines/index'

export const Route = createFileRoute('/project/$ref/database/pipelines/')({
  component: DatabasePipelinesIndexRoute,
})

function DatabasePipelinesIndexRoute() {
  return <DatabasePipelinesPage dehydratedState={undefined} />
}
