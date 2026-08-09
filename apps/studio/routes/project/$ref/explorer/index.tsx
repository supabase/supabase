import { createFileRoute } from '@tanstack/react-router'

import { ExplorerHome } from '@/components/interfaces/Explorer/ExplorerHome'

export const Route = createFileRoute('/project/$ref/explorer/')({
  component: ProjectExplorerIndexRoute,
})

function ProjectExplorerIndexRoute() {
  return <ExplorerHome />
}
