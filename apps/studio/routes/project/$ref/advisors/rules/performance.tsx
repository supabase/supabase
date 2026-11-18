import { createFileRoute } from '@tanstack/react-router'

import { AdvisorRules } from '@/components/interfaces/Advisors/AdvisorRules'

export const Route = createFileRoute('/project/$ref/advisors/rules/performance')({
  component: AdvisorPerformanceRulesPage,
})

function AdvisorPerformanceRulesPage() {
  return <AdvisorRules category="performance" />
}
