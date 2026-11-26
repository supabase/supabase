import { createFileRoute } from '@tanstack/react-router'

import { ObservabilityOverview } from '@/components/interfaces/Observability/ObservabilityOverview'

export const Route = createFileRoute('/project/$ref/observability/')({
  component: UserReportPage,
  staticData: {
    observabilityLayoutTitle: 'Overview',
  },
})

function UserReportPage() {
  return <ObservabilityOverview />
}
