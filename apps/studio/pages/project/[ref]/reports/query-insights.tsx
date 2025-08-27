import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import { NextPageWithLayout } from 'types'

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
      <div>Content here...</div>
    </>
  )
}
