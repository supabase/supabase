import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import type { NextPageWithLayout } from 'types'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { authenticationPolicies } = useIsFeatureEnabled(['authentication:policies'])

  if (authenticationPolicies) {
    return <RealtimePolicies />
  } else {
    return <UnknownInterface urlBack={`/project/${ref}/realtime/inspector`} />
  }
}

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Policies">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
