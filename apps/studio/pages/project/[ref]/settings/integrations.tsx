import IntegrationSettings from 'components/interfaces/Settings/Integrations/IntegrationsSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer bottomPadding>
      <IntegrationSettings />
    </ScaffoldContainer>
  )
}

OrgIntegrationSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Integrations">
      <PageLayout title="Integrations">{page}</PageLayout>
    </SettingsLayout>
  </DefaultLayout>
)
export default OrgIntegrationSettings
