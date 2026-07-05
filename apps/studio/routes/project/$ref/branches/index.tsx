import { createFileRoute } from '@tanstack/react-router'

import BranchesPage, { BranchesPageWrapper } from '@/pages/project/[ref]/branches/index'

export const Route = createFileRoute('/project/$ref/branches/')({
  component: BranchesIndexRoute,
})

function BranchesIndexRoute() {
  return (
    <BranchesPageWrapper>
      <BranchesPage dehydratedState={undefined} />
    </BranchesPageWrapper>
  )
}
