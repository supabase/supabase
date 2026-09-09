import { createFileRoute } from '@tanstack/react-router'

import ExplorerSchemaPage from '@/pages/project/[ref]/explorer/schema'

export const Route = createFileRoute('/project/$ref/explorer/schema')({
  component: ProjectExplorerSchemaRoute,
})

function ProjectExplorerSchemaRoute() {
  return <ExplorerSchemaPage dehydratedState={undefined} />
}
