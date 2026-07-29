import { createFileRoute } from '@tanstack/react-router'

import UserActivityPage from '@/pages/project/[ref]/observability/user-activity'

export const Route = createFileRoute('/project/$ref/observability/user-activity')({
  component: ObservabilityUserActivityRoute,
  staticData: {
    observabilityLayoutTitle: 'User Activity',
  },
})

function ObservabilityUserActivityRoute() {
  return <UserActivityPage dehydratedState={undefined} />
}
