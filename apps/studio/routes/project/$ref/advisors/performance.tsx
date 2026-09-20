import { createFileRoute } from '@tanstack/react-router'

import AdvisorsPerformancePage from '@/pages/project/[ref]/advisors/performance'

export const Route = createFileRoute('/project/$ref/advisors/performance')({
  component: AdvisorsPerformanceRoute,
  staticData: {
    advisorsLayoutTitle: 'Linter',
  },
})

function AdvisorsPerformanceRoute() {
  return <AdvisorsPerformancePage dehydratedState={undefined} />
}
