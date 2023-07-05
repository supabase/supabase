import { observer } from 'mobx-react-lite'

import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

import SubscriptionV2 from 'components/interfaces/BillingV2/Subscription/Subscription'

const ProjectBilling: NextPageWithLayout = () => {
  return <SubscriptionV2 />
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBilling)
