import { WarehouseMetricsReport } from '@/components/interfaces/Observability/Warehouse/WarehouseMetricsReport'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from '@/types'

const WarehouseReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <WarehouseMetricsReport />
    </ReportPadding>
  )
}

WarehouseReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Warehouse">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default WarehouseReport
