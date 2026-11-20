import { createFileRoute } from '@tanstack/react-router'

import { WarehouseMetricsReport } from '@/components/interfaces/Observability/Warehouse/WarehouseMetricsReport'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'

export const Route = createFileRoute('/project/$ref/observability/warehouse')({
  component: WarehouseReportRoute,
  staticData: { observabilityLayoutTitle: 'Warehouse' },
})

function WarehouseReportRoute() {
  return (
    <ReportPadding>
      <WarehouseMetricsReport />
    </ReportPadding>
  )
}
