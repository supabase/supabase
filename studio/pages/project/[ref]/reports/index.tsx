import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { useFlag, useStore } from 'hooks'
import { ProjectLayoutWithAuth } from 'components/layouts'
import PresetReport from 'components/interfaces/Reports/PresetReport'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { DashboardReportPage } from './dashboard'

export const ReportsOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query
  const reportsOverview = useFlag('reportsOverview')

  const Layout = reportsOverview ? ReportsLayout : ProjectLayoutWithAuth

  return (
    <Layout>
      {reportsOverview ? (
        <PresetReport preset={Presets.OVERVIEW} projectRef={ref as string} />
      ) : (
        <DashboardReportPage />
      )}
    </Layout>
  )
}

// TODO: uncomment when reportsOverview flag is removed
// hooks do not work with next.js .getLayout
// ReportsOverviewPage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ReportsOverviewPage)
