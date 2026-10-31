import { createFileRoute } from '@tanstack/react-router'

import AdvisorsSecurityPage from '@/pages/project/[ref]/advisors/security'

export const Route = createFileRoute('/project/$ref/advisors/security')({
  component: AdvisorsSecurityRoute,
  staticData: {
    advisorsLayoutTitle: 'Linter',
  },
})

function AdvisorsSecurityRoute() {
  return <AdvisorsSecurityPage dehydratedState={undefined} />
}
