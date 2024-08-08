import ServiceList from 'components/interfaces/Settings/API/ServiceList'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ApiSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer id="billing-page-top">
        <ScaffoldHeader>
          <ScaffoldTitle>API Settings</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <ServiceList />
      </ScaffoldContainer>
    </>
  )
}

ApiSettings.getLayout = (page) => <SettingsLayout title="API Settings">{page}</SettingsLayout>
export default ApiSettings
