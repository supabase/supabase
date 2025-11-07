import { ServiceList } from 'components/interfaces/Settings/API/ServiceList'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const ApiSettings: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer bottomPadding>
      <ServiceList />
    </ScaffoldContainer>
  )
}

ApiSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="API Settings">
      <PageLayout title="API Settings">{page}</PageLayout>
    </SettingsLayout>
  </DefaultLayout>
)
export default ApiSettings
