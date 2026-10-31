import { createFileRoute } from '@tanstack/react-router'

import QueryPerformanceReport from '@/pages/project/[ref]/observability/query-performance'

export const Route = createFileRoute('/project/$ref/observability/query-performance')({
  component: ObservabilityQueryPerformanceRoute,
  staticData: {
    observabilityLayoutTitle: 'Query Performance',
  },
})

function ObservabilityQueryPerformanceRoute() {
  return <QueryPerformanceReport dehydratedState={undefined} />
}
