import { AvailableIntegrations } from 'components/interfaces/Integrations/Landing/AvailableIntegrations'
import { InstalledIntegrations } from 'components/interfaces/Integrations/Landing/InstalledIntegrations'
import DefaultLayout from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import type { NextPageWithLayout } from 'types'

const IntegrationsPage: NextPageWithLayout = () => {
  return (
    <div>
      <InstalledIntegrations />
      <AvailableIntegrations />
    </div>
  )
}

IntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationsPage
