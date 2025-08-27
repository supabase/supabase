import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import { NextPageWithLayout } from 'types'
import { QueryQuickGlance } from 'components/interfaces/QueryInsights/QueryQuickGlance'

const QueryInsightsReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <QueryInsights />
    </ReportPadding>
  )
}

QueryInsightsReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Query Insights">{page}</ReportsLayout>
  </DefaultLayout>
)

export default QueryInsightsReport

const QueryInsights = () => {
  return (
    <>
      <ReportHeader title="Query Insights" />
      <ReportStickyNav
        content={
          <>
            <div>Date picker here</div>
          </>
        }
      />
      <QueryQuickGlance />
      <div>Tab group</div>
      <div>Metrics explorer...</div>
      <div>Row expolrer...</div>
    </>
  )
}
