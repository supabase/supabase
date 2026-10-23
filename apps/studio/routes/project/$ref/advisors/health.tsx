import { createFileRoute } from '@tanstack/react-router'

import AdvisorsHealthPage from '@/pages/project/[ref]/advisors/health'

export const Route = createFileRoute('/project/$ref/advisors/health')({
  component: AdvisorsHealthRoute,
  // Page is a useEffect redirect to /issues that returns null
  staticData: { skipAdvisorsLayout: true },
})

function AdvisorsHealthRoute() {
  return <AdvisorsHealthPage dehydratedState={undefined} />
}
