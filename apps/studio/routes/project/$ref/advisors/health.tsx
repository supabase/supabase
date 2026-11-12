import { createFileRoute } from '@tanstack/react-router'

import { LegacyAdvisorsLayout } from '@/components/layouts/AdvisorsLayout/LegacyAdvisorsLayout'
import AdvisorsHealthPage from '@/pages/project/[ref]/advisors/health'

export const Route = createFileRoute('/project/$ref/advisors/health')({
  component: AdvisorsHealthRoute,
  staticData: { skipAdvisorsLayout: true },
})

function AdvisorsHealthRoute() {
  return (
    <LegacyAdvisorsLayout>
      <AdvisorsHealthPage dehydratedState={undefined} />
    </LegacyAdvisorsLayout>
  )
}
