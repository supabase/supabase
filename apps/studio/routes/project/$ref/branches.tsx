import { createFileRoute, Outlet } from '@tanstack/react-router'

import BranchLayout from '@/components/layouts/BranchLayout/BranchLayout'

export const Route = createFileRoute('/project/$ref/branches')({
  component: BranchesShell,
})

function BranchesShell() {
  return (
    <BranchLayout>
      <Outlet />
    </BranchLayout>
  )
}
