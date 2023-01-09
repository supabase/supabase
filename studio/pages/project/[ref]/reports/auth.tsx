import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  renderDailyActiveUsers,
  renderNewUsers,
  renderCumulativeUsers,
  renderFailedMigrations,
  renderSignUpProviders,
  renderUnverifiedUsers,
  renderBannedUsers,
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
  const signUpProviders = hooks.signUpProviders()
  const unverifiedUsers = hooks.unverifiedUsers()
  const bannedUsers = hooks.bannedUsers()

  const { isLoading, Layout } = usePresetReport([
    dailyActiveUsers,
    newUsers,
    cumulativeUsers,
    failedMigrations,
    signUpProviders,
    unverifiedUsers,
  ])
  return (
    <Layout title={config.title}>
      <div className="flex flex-col grid  lg:grid-cols-6 gap-4">
        <h2>User Activity</h2>

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

        <ReportWidget
          isLoading={isLoading}
          params={signUpProviders[0].params}
          className="row-span-4 col-span-4 col-start-3"
          title="Sign Up Providers"
          description="The breakdown of providers used for user creation"
          data={signUpProviders[0].data!}
          renderer={renderSignUpProviders}
        />
        <ReportWidget
          isLoading={isLoading}
          params={unverifiedUsers[0].params}
          className="row-span-1 col-span-2 col-start-1"
          title="Unverified Users"
          tooltip="High number of unverified users may indicate spamming and malicious behavior."
          data={unverifiedUsers[0].data! || []}
          renderer={renderUnverifiedUsers}
        />

        <ReportWidget
          isLoading={isLoading}
          params={bannedUsers[0].params}
          className="row-span-1 col-span-2 col-start-1"
          title="Banned Users"
          tooltip="High number of banned users may indicate malicious behavior."
          data={bannedUsers[0].data! || []}
          renderer={renderBannedUsers}
        />

        <h2 className="col-span-full">Sever Health</h2>
        <ReportWidget
          isLoading={isLoading}
          params={failedMigrations[0].params}
          className="col-span-2 col-start-1"
          title="Failed Migrations"
          tooltip="Failed GoTrue migrations may cause issues with user authentication."
          data={failedMigrations[0].logData!}
          renderer={renderFailedMigrations}
        />
      </div>
    </Layout>
  )
}

AuthReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(AuthReport)
