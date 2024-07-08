import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
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

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default PageLayout
