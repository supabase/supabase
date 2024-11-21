import { AvailableIntegrations } from 'components/interfaces/Integrations/Landing/AvailableIntegrations'
import { InstalledIntegrations } from 'components/interfaces/Integrations/Landing/InstalledIntegrations'
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

IntegrationsPage.getLayout = (page) => <IntegrationsLayout>{page}</IntegrationsLayout>

export default IntegrationsPage
