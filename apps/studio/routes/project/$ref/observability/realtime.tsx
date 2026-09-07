import { createFileRoute } from '@tanstack/react-router'

import RealtimeReport from '@/pages/project/[ref]/observability/realtime'

export const Route = createFileRoute('/project/$ref/observability/realtime')({
  component: ObservabilityRealtimeRoute,
  staticData: {
    observabilityLayoutTitle: 'Realtime',
  },
})

function ObservabilityRealtimeRoute() {
  return <RealtimeReport dehydratedState={undefined} />
}
