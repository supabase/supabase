import { ApiGatewayReportPageContent } from 'components/interfaces/Reports/ApiGatewayReportPageContent'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from 'types'

export const ApiReport: NextPageWithLayout = () => <ApiGatewayReportPageContent />

ApiReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="API Gateway">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default ApiReport
