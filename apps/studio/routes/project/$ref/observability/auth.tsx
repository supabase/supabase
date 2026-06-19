import { createFileRoute } from '@tanstack/react-router'

import AuthReport from '@/pages/project/[ref]/observability/auth'

export const Route = createFileRoute('/project/$ref/observability/auth')({
  component: ObservabilityAuthRoute,
  staticData: {
    observabilityLayoutTitle: 'Auth',
  },
})

function ObservabilityAuthRoute() {
  return <AuthReport dehydratedState={undefined} />
}
