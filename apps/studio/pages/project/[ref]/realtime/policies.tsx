import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import type { NextPageWithLayout } from 'types'

import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return <RealtimePolicies />
}

RealtimePoliciesPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Realtime Policies">
      <RealtimeLayout title="Policies">{page}</RealtimeLayout>
    </DefaultLayout>
  </AppLayout>
)

export default RealtimePoliciesPage
