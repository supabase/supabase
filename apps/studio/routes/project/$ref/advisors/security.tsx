import { createFileRoute } from '@tanstack/react-router'

import AdvisorsSecurityPage from '@/pages/project/[ref]/advisors/security'

export const Route = createFileRoute('/project/$ref/advisors/security')({
  component: AdvisorsSecurityRoute,
  // Page is a useEffect redirect to /issues that returns null
  staticData: { skipAdvisorsLayout: true },
})

function AdvisorsSecurityRoute() {
  return <AdvisorsSecurityPage dehydratedState={undefined} />
}
