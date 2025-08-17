import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { ServiceList } from 'components/interfaces/Settings/API/ServiceList'

const ApiSettings: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer bottomPadding>
      <ScaffoldHeader>
        <ScaffoldTitle>API Settings</ScaffoldTitle>
      </ScaffoldHeader>
      <ServiceList />
    </ScaffoldContainer>
  )
}

ApiSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="API Settings">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ApiSettings
