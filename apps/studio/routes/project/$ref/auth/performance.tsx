import { createFileRoute } from '@tanstack/react-router'

import PerformancePage from '@/pages/project/[ref]/auth/performance'

export const Route = createFileRoute('/project/$ref/auth/performance')({
  component: AuthPerformanceRoute,
  staticData: {
    authLayoutTitle: 'Performance',
  },
})

function AuthPerformanceRoute() {
  return <PerformancePage dehydratedState={undefined} />
}
