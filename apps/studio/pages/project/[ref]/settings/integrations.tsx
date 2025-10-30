import IntegrationSettings from 'components/interfaces/Settings/Integrations/IntegrationsSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Integrations</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldDivider />
      <IntegrationSettings />
    </>
  )
}

OrgIntegrationSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>{page}</SettingsLayout>
  </DefaultLayout>
)
export default OrgIntegrationSettings
