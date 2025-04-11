import { QueryInsights } from 'components/interfaces/QueryInsights/QueryInsights'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const QueryInsightsPage: NextPageWithLayout = () => {
  return (
    <div className="h-full flex flex-col">
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
