import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { ReportsLayout } from 'components/layouts'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import { renderRequestsPathsTable } from 'components/interfaces/Reports/renderers/ApiRenderers'

export const ApiReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query
  const config = PRESET_CONFIG[Presets.API]
  const hooks = hooksFactory(ref as string, config)
  const requestPaths = hooks.requestPaths()
  const { isLoading, Layout } = usePresetReport([requestPaths], { wideLayout: true })
  return (
    <Layout title={`${config.title} - Slow Query Finder`}>
      <ReportWidget
        isLoading={isLoading}
        params={requestPaths[0].params}
        title="Slow API Requests"
        description="Most frequently used requests, sorted by total querying time"
        data={requestPaths[0].logData || []}
        renderer={renderRequestsPathsTable}
      />
    </Layout>
  )
}

ApiReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ApiReport)
