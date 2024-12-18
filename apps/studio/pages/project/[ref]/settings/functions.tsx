import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
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

const PageLayout: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Edge Function Secrets Management</ScaffoldTitle>
          <ScaffoldDescription>
            Manage the secrets for your project's edge functions
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <EdgeFunctionSecrets />
      </ScaffoldContainer>
    </>
  )
}

PageLayout.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <SettingsLayout title="Settings">{page}</SettingsLayout>
    </DefaultLayout>
  </AppLayout>
)

export default PageLayout
