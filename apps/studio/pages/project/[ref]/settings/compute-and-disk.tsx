import { DiskManagementForm } from 'components/interfaces/DiskManagement/DiskManagementForm'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const AuthSettings: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Compute and Disk</ScaffoldTitle>
          <ScaffoldDescription>
            Configure the compute and disk settings for your project.
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <DiskManagementForm />
    </>
  )
}

AuthSettings.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </DefaultLayout>
  </AppLayout>
)
export default AuthSettings
