import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
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
            <ScaffoldTitle>Edge Function Environment Variables</ScaffoldTitle>
            <ScaffoldDescription>
              Manage the environment variables (secrets) for your project's edge functions
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

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default PageLayout
