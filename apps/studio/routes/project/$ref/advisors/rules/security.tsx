import { createFileRoute } from '@tanstack/react-router'

import { AdvisorRules } from '@/components/interfaces/Advisors/AdvisorRules'

export const Route = createFileRoute('/project/$ref/advisors/rules/security')({
  component: AdvisorSecurityRulesPage,
})

function AdvisorSecurityRulesPage() {
  return <AdvisorRules category="security" />
}
