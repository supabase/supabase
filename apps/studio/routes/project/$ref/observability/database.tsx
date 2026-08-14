import { createFileRoute } from '@tanstack/react-router'

import DatabaseReport from '@/pages/project/[ref]/observability/database'

export const Route = createFileRoute('/project/$ref/observability/database')({
  component: ObservabilityDatabaseRoute,
  staticData: {
    observabilityLayoutTitle: 'Database',
  },
})

function ObservabilityDatabaseRoute() {
  return <DatabaseReport dehydratedState={undefined} />
}
