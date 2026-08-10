import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'

export const Route = createFileRoute('/project/$ref/explorer')({
  component: ExplorerShell,
})

function ExplorerShell() {
  return (
    <ExplorerLayout>
      <Outlet />
    </ExplorerLayout>
  )
}
