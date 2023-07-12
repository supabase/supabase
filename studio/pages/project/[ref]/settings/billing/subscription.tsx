import { observer } from 'mobx-react-lite'

import SubscriptionV2 from 'components/interfaces/BillingV2/Subscription/Subscription'
import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const ProjectBilling: NextPageWithLayout = () => {
  return <SubscriptionV2 />
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBilling)
