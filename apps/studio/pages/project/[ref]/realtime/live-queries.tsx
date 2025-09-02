import type { NextPageWithLayout } from 'types'

import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { LiveQueriesPageContent } from 'components/interfaces/Realtime/LiveQueries/LiveQueriesPageContent'

const LiveQueriesPage: NextPageWithLayout = () => {
  return <LiveQueriesPageContent />
}

LiveQueriesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Realtime">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default LiveQueriesPage
