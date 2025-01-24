import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import Reports from 'components/interfaces/Reports/Reports'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import type { NextPageWithLayout } from 'types'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'

const PageLayout: NextPageWithLayout = () => (
  <div className="mx-auto flex flex-col gap-4 w-full">
    <ReportPadding>
      <Reports />
    </ReportPadding>
  </div>
)

PageLayout.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Reports">
      <ReportsLayout>{page}</ReportsLayout>
    </DefaultLayout>
  </AppLayout>
)

export default PageLayout
