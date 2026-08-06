import { createFileRoute } from '@tanstack/react-router'

import { ExplorerPage } from '@/components/interfaces/Explorer/ExplorerPage'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'

export const Route = createFileRoute('/project/$ref/explorer')({
  component: ProjectExplorerRoute,
})

function ProjectExplorerRoute() {
  return (
    <ExplorerLayout>
      <ExplorerPage />
    </ExplorerLayout>
  )
}
