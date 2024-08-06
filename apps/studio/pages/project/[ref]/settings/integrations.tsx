import IntegrationSettings from 'components/interfaces/Settings/Integrations/IntegrationsSettings'
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

OrgIntegrationSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default OrgIntegrationSettings
