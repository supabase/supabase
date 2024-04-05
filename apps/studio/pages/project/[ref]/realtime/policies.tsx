import { RealtimePolicies } from 'components/interfaces/Realtime/Policies/StoragePolicies'
import type { NextPageWithLayout } from 'types'

import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return <RealtimePolicies />
}

RealtimePoliciesPage.getLayout = (page) => <RealtimeLayout title="Policies">{page}</RealtimeLayout>

export default RealtimePoliciesPage
