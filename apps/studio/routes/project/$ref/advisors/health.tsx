import { createFileRoute } from '@tanstack/react-router'

import AdvisorsHealthPage from '@/pages/project/[ref]/advisors/health'

export const Route = createFileRoute('/project/$ref/advisors/health')({
  component: AdvisorsHealthRoute,
  staticData: {
    advisorsLayoutTitle: 'Linter',
  },
})

function AdvisorsHealthRoute() {
  return <AdvisorsHealthPage dehydratedState={undefined} />
}
