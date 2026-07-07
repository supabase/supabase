import { createFileRoute } from '@tanstack/react-router'

import PostgRESTReport from '@/pages/project/[ref]/observability/postgrest'

export const Route = createFileRoute('/project/$ref/observability/postgrest')({
  component: ObservabilityPostgRESTRoute,
  staticData: {
    observabilityLayoutTitle: 'PostgREST',
  },
})

function ObservabilityPostgRESTRoute() {
  return <PostgRESTReport dehydratedState={undefined} />
}
