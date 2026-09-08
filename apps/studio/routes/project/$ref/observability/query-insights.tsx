import { createFileRoute } from '@tanstack/react-router'

import QueryInsightsReport from '@/pages/project/[ref]/observability/query-insights'

export const Route = createFileRoute('/project/$ref/observability/query-insights')({
  component: ObservabilityQueryInsightsRoute,
  staticData: {
    observabilityLayoutTitle: 'Query insights',
  },
})

function ObservabilityQueryInsightsRoute() {
  return <QueryInsightsReport dehydratedState={undefined} />
}
