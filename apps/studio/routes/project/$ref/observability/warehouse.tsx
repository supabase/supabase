import { createFileRoute } from '@tanstack/react-router'

import { WarehouseMetricsReport } from '@/components/interfaces/Observability/Warehouse/WarehouseMetricsReport'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'

export const Route = createFileRoute('/project/$ref/observability/warehouse')({
  component: WarehouseReport,
  staticData: {
    observabilityLayoutTitle: 'Warehouse',
  },
})

function WarehouseReport() {
  return (
    <ReportPadding>
      <WarehouseMetricsReport />
    </ReportPadding>
  )
}
