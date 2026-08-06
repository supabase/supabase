import { createFileRoute } from '@tanstack/react-router'

import { ExplorerHome } from '@/components/interfaces/Explorer/ExplorerHome'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'

export const Route = createFileRoute('/project/$ref/explorer')({
  component: ProjectExplorerRoute,
})

function ProjectExplorerRoute() {
  return (
    <ExplorerLayout>
      <ExplorerHome />
    </ExplorerLayout>
  )
}
