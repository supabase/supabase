import ServiceList from 'components/interfaces/Settings/API/ServiceList'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
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

ApiSettings.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)
export default ApiSettings
