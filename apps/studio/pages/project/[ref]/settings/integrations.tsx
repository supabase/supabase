import IntegrationSettings from 'components/interfaces/Settings/Integrations/IntegrationsSettings'
import { SettingsLayout } from 'components/layouts'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return <IntegrationSettings />
}

OrgIntegrationSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default OrgIntegrationSettings
