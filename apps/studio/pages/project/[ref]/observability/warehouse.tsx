import { WarehouseObservabilityPanel } from '@/components/interfaces/Database/Warehouse/WarehouseObservabilityPanel'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import ReportPadding from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from '@/types'

const REPORT_TITLE = 'Warehouse'

const WarehouseObservabilityReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <ReportHeader title={REPORT_TITLE} />
      <WarehouseObservabilityPanel />
    </ReportPadding>
  )
}

WarehouseObservabilityReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Warehouse">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default WarehouseObservabilityReport
