import type { NextPageWithLayout } from 'types'

import { RealtimeInspector } from 'components/interfaces/Realtime/Inspector'
import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'

export const InspectorPage: NextPageWithLayout = () => {
  return <RealtimeInspector />
}

InspectorPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Realtime Inspector">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default InspectorPage
