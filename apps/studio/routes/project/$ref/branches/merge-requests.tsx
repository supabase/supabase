import { createFileRoute } from '@tanstack/react-router'

import MergeRequestsPage, {
  MergeRequestsPageWrapper,
} from '@/pages/project/[ref]/branches/merge-requests'

export const Route = createFileRoute('/project/$ref/branches/merge-requests')({
  component: MergeRequestsRoute,
})

function MergeRequestsRoute() {
  return (
    <MergeRequestsPageWrapper>
      <MergeRequestsPage dehydratedState={undefined} />
    </MergeRequestsPageWrapper>
  )
}
