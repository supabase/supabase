import { createFileRoute } from '@tanstack/react-router'

import AdvisorSecurityRulesPage from '@/pages/project/[ref]/advisors/rules/security'

export const Route = createFileRoute('/project/$ref/advisors/rules/security')({
  component: AdvisorRulesSecurityRoute,
})

function AdvisorRulesSecurityRoute() {
  return <AdvisorSecurityRulesPage dehydratedState={undefined} />
}
