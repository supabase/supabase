import { createFileRoute } from '@tanstack/react-router'

import EdgeFunctionsReportV2 from '@/pages/project/[ref]/observability/edge-functions'

export const Route = createFileRoute('/project/$ref/observability/edge-functions')({
  component: ObservabilityEdgeFunctionsRoute,
  staticData: {
    observabilityLayoutTitle: 'Edge Functions',
  },
})

function ObservabilityEdgeFunctionsRoute() {
  return <EdgeFunctionsReportV2 dehydratedState={undefined} />
}
