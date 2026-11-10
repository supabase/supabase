import { createFileRoute } from '@tanstack/react-router'

import { LegacyAdvisorsLayout } from '@/components/layouts/AdvisorsLayout/LegacyAdvisorsLayout'
import AdvisorsPerformancePage from '@/pages/project/[ref]/advisors/performance'

export const Route = createFileRoute('/project/$ref/advisors/performance')({
  component: AdvisorsPerformanceRoute,
  staticData: { skipAdvisorsLayout: true },
})

function AdvisorsPerformanceRoute() {
  return (
    <LegacyAdvisorsLayout>
      <AdvisorsPerformancePage dehydratedState={undefined} />
    </LegacyAdvisorsLayout>
  )
}
