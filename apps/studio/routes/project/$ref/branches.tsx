import { createFileRoute, Outlet } from '@tanstack/react-router'

import BranchLayout from '@/components/layouts/BranchLayout/BranchLayout'

export const Route = createFileRoute('/project/$ref/branches')({
  component: BranchesShell,
})

// BranchLayout sibling-file shell. Each leaf renders its own per-page
// PageLayout (different titles + primary/secondary actions); we keep
// that wrapping in the leaf route files via the page-side
// `*PageWrapper` exports rather than trying to share PageLayout in the
// shell — the shell deliberately stops at BranchLayout.
function BranchesShell() {
  return (
    <BranchLayout>
      <Outlet />
    </BranchLayout>
  )
}
