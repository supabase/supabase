import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  renderDailyActiveUsers,
  renderNewUsers,
  renderCumulativeUsers,
  renderFailedMigrations,
} from 'components/interfaces/Reports/renderers/AuthRenderers'

export const AuthReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query
  const config = PRESET_CONFIG[Presets.AUTH]
  const hooks = hooksFactory(ref as string, config)
  const dailyActiveUsers = hooks.dailyActiveUsers()
  const newUsers = hooks.newUsers()
  const cumulativeUsers = hooks.cumulativeUsers()
  const failedMigrations = hooks.failedMigrations()

  const { isLoading, Layout } = usePresetReport([dailyActiveUsers, newUsers, cumulativeUsers])
  return (
    <Layout title={config.title}>
      <div className="grid  lg:grid-cols-6 gap-4">
        <ReportWidget
          isLoading={isLoading}
          params={failedMigrations[0].params}
          className="col-span-2 col-start-1"
          title="Failed GoTrue Migrations"
          tooltip="Failed migrations may cause issues with user authentication."
          data={failedMigrations[0].logData!}
          renderer={renderFailedMigrations}
        />
        <ReportWidget
          isLoading={isLoading}
          params={cumulativeUsers[0].params}
          className="col-span-3 col-start-1"
          title="Users Over Time"
          description="Cumulative count of confirmed users"
          data={cumulativeUsers[0].data!}
          renderer={renderCumulativeUsers}
        />
        <ReportWidget
          isLoading={isLoading}
          params={newUsers[0].params}
          className="col-span-3 col-start-4"
          title="Daily New Users"
          description="The daily count of new user signups"
          data={newUsers[0].data!}
          renderer={renderNewUsers}
        />
        <ReportWidget
          isLoading={isLoading}
          params={dailyActiveUsers[0].params}
          className="col-span-6 col-start-1"
          title="Daily Active Users"
          description="The daily count of active authenticated users"
          data={dailyActiveUsers[0].logData!}
          renderer={renderDailyActiveUsers}
        />
      </div>
    </Layout>
  )
}

AuthReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(AuthReport)
