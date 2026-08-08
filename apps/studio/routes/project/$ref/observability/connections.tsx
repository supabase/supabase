import { createFileRoute } from '@tanstack/react-router'

import DatabaseConnections from '@/pages/project/[ref]/observability/connections'

export const Route = createFileRoute('/project/$ref/observability/connections')({
  component: ObservabilityConnectionsRoute,
  staticData: {
    observabilityLayoutTitle: 'API Gateway',
  },
})

function ObservabilityConnectionsRoute() {
  return <DatabaseConnections dehydratedState={undefined} />
}
