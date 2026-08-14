import { createFileRoute } from '@tanstack/react-router'

import ObservabilityReportPage from '@/pages/project/[ref]/observability/[id]'

export const Route = createFileRoute('/project/$ref/observability/$id')({
  component: ObservabilityReportRoute,
  staticData: {
    observabilityLayoutTitle: 'Report',
  },
})

function ObservabilityReportRoute() {
  return <ObservabilityReportPage dehydratedState={undefined} />
}
