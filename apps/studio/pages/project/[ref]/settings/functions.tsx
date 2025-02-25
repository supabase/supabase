import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'

const PageLayout: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="flex flex-row justify-between">
          <div>
            <ScaffoldTitle>Edge Function Secrets</ScaffoldTitle>
            <ScaffoldDescription>
              Manage the secrets (environment variables) for your project's Edge Functions
            </ScaffoldDescription>
          </div>
          <div className="flex items-center space-x-2">
            <DocsButton href="https://supabase.com/docs/guides/functions/secrets" />
          </div>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <EdgeFunctionSecrets />
      </ScaffoldContainer>
    </>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Settings">{page}</SettingsLayout>
  </DefaultLayout>
)

export default PageLayout
