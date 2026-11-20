import { createFileRoute } from '@tanstack/react-router'

import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import Reports from '@/components/interfaces/Reports/Reports'

export const Route = createFileRoute('/project/$ref/observability/$id')({
  component: ObservabilityReportPage,
  staticData: {
    observabilityLayoutTitle: 'Report',
  },
})

function ObservabilityReportPage() {
  return (
    <div className="mx-auto flex flex-col gap-4 w-full grow">
      <ReportPadding>
        <Reports />
      </ReportPadding>
    </div>
  )
}
