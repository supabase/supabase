import { createFileRoute } from '@tanstack/react-router'

import AdvisorsPerformancePage from '@/pages/project/[ref]/advisors/performance'

export const Route = createFileRoute('/project/$ref/advisors/performance')({
  component: AdvisorsPerformanceRoute,
  // Page is a useEffect redirect to /issues that returns null
  staticData: { skipAdvisorsLayout: true },
})

function AdvisorsPerformanceRoute() {
  return <AdvisorsPerformancePage dehydratedState={undefined} />
}
