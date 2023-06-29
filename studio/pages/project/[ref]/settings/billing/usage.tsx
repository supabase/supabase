import { observer } from 'mobx-react-lite'

import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import Usage from 'components/interfaces/BillingV2/Usage/Usage'

const ProjectBillingUsage: NextPageWithLayout = () => {
  return <Usage />
}

ProjectBillingUsage.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBillingUsage)
