import { createFileRoute } from '@tanstack/react-router'

import AdvisorPerformanceRulesPage from '@/pages/project/[ref]/advisors/rules/performance'

export const Route = createFileRoute('/project/$ref/advisors/rules/performance')({
  component: AdvisorRulesPerformanceRoute,
})

function AdvisorRulesPerformanceRoute() {
  return <AdvisorPerformanceRulesPage dehydratedState={undefined} />
}
