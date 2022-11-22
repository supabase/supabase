import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import {
  renderErrorRateChart,
  renderRequestsPathsTable,
  renderStatusCodesChart,
} from 'components/interfaces/Reports/renderers/OverviewRenderers'

export const ApiOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query
  const config = PRESET_CONFIG[Presets.OVERVIEW]
  const hooks = hooksFactory(ref as string, config)
  const [statusCodes, statusCodesHandlers] = hooks.statusCodes()
  const [errorRate, errorRateHandlers] = hooks.errorRate()
  const [requestPaths, requestPathsHandlers] = hooks.requestPaths()
  const { isLoading, Layout } = usePresetReport(
    [statusCodes, errorRate, requestPaths],
    [statusCodesHandlers, errorRateHandlers, requestPathsHandlers]
  )
  return (
    <Layout title={config.title}>
      <div className="grid  lg:grid-cols-4">
        <ReportWidget
          isLoading={isLoading}
          params={statusCodes.params}
          className="col-span-4 col-start-1"
          title="API Status Codes"
          description="Distribution of API responses by status codes."
          data={statusCodes.logData}
          renderer={renderStatusCodesChart}
        />
        <ReportWidget
          isLoading={isLoading}
          params={errorRate.params}
          className="col-span-4 col-start-1"
          title="Error Rate"
          description="Percentage of API 5XX and 4XX error responses."
          data={errorRate.logData}
          renderer={renderErrorRateChart}
        />
        <ReportWidget
          isLoading={isLoading}
          params={requestPaths.params}
          className="col-span-4 col-start-1"
          title="Slow API Requests"
          description="Most frequently used requests, sorted by total querying time"
          data={requestPaths.logData}
          renderer={renderRequestsPathsTable}
        />
      </div>
    </Layout>
  )
}

ApiOverviewPage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ApiOverviewPage)
