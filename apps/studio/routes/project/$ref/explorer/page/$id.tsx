import { createFileRoute } from '@tanstack/react-router'

import GeneratedPagePage from '@/pages/project/[ref]/explorer/page/[id]'

export const Route = createFileRoute('/project/$ref/explorer/page/$id')({
  component: ProjectExplorerGeneratedPageRoute,
})

function ProjectExplorerGeneratedPageRoute() {
  return <GeneratedPagePage dehydratedState={undefined} />
}
