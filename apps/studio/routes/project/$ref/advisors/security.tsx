import { createFileRoute } from '@tanstack/react-router'

import { LegacyAdvisorsLayout } from '@/components/layouts/AdvisorsLayout/LegacyAdvisorsLayout'
import AdvisorsSecurityPage from '@/pages/project/[ref]/advisors/security'

export const Route = createFileRoute('/project/$ref/advisors/security')({
  component: AdvisorsSecurityRoute,
  staticData: { skipAdvisorsLayout: true },
})

function AdvisorsSecurityRoute() {
  return (
    <LegacyAdvisorsLayout>
      <AdvisorsSecurityPage dehydratedState={undefined} />
    </LegacyAdvisorsLayout>
  )
}
