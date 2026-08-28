import { createFileRoute } from '@tanstack/react-router'

import UserReportPage from '@/pages/project/[ref]/observability/index'

export const Route = createFileRoute('/project/$ref/observability/')({
  component: ObservabilityIndexRoute,
  staticData: {
    observabilityLayoutTitle: 'Overview',
  },
})

function ObservabilityIndexRoute() {
  return <UserReportPage dehydratedState={undefined} />
}
