import { createFileRoute } from '@tanstack/react-router'

import ApiReport from '@/pages/project/[ref]/observability/api-overview'

export const Route = createFileRoute('/project/$ref/observability/api-overview')({
  component: ObservabilityApiOverviewRoute,
  staticData: {
    observabilityLayoutTitle: 'API Gateway',
  },
})

function ObservabilityApiOverviewRoute() {
  return <ApiReport dehydratedState={undefined} />
}
