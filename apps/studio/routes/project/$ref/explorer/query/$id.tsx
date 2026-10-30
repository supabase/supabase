import { createFileRoute } from '@tanstack/react-router'

import QueryPage from '@/pages/project/[ref]/explorer/query/[id]'

export const Route = createFileRoute('/project/$ref/explorer/query/$id')({
  component: ProjectExplorerQueryRoute,
})

function ProjectExplorerQueryRoute() {
  return <QueryPage dehydratedState={undefined} />
}
