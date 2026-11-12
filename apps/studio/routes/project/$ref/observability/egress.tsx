import { createFileRoute } from '@tanstack/react-router'

import EgressReport from '@/pages/project/[ref]/observability/egress'

export const Route = createFileRoute('/project/$ref/observability/egress')({
  component: ObservabilityEgressRoute,
  staticData: {
    observabilityLayoutTitle: 'Egress',
  },
})

function ObservabilityEgressRoute() {
  return <EgressReport dehydratedState={undefined} />
}
