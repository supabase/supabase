import { createFileRoute } from '@tanstack/react-router'

import DatabasePipelinesPage from '@/pages/project/[ref]/database/pipelines/[pipelineId]'

export const Route = createFileRoute('/project/$ref/database/pipelines/$pipelineId')({
  component: DatabasePipelinesPipelineRoute,
})

function DatabasePipelinesPipelineRoute() {
  return <DatabasePipelinesPage dehydratedState={undefined} />
}
