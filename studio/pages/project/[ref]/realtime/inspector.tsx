import { NextPageWithLayout } from 'types'

import { RealtimeInspector } from 'components/interfaces/Realtime/Inspector'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'

export const InspectorPage: NextPageWithLayout = () => {
  return <RealtimeInspector />
}

InspectorPage.getLayout = (page) => <RealtimeLayout title="Realtime">{page}</RealtimeLayout>

export default InspectorPage
