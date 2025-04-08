import { QueryInsights } from 'components/interfaces/QueryInsights/QueryInsights'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const QueryInsightsPage: NextPageWithLayout = () => {
  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Query Insights"
        description="Monitor and analyze query performance with enhanced metrics"
        docsUrl="https://supabase.com/docs/guides/platform/performance"
        actions={<DatabaseSelector />}
      />
      <QueryInsights />
    </div>
  )
}

QueryInsightsPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Query insights">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default QueryInsightsPage
