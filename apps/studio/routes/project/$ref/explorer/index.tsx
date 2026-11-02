import { createFileRoute } from '@tanstack/react-router'

import ProjectExplorerPage from '@/pages/project/[ref]/explorer'

export const Route = createFileRoute('/project/$ref/explorer/')({
  component: ProjectExplorerIndexRoute,
})

function ProjectExplorerIndexRoute() {
  return <ProjectExplorerPage dehydratedState={undefined} />
}
