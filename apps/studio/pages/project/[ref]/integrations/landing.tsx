import { AvailableIntegrations } from 'components/interfaces/Integrations/Landing/AvailableIntegrations'
import { InstalledIntegrations } from 'components/interfaces/Integrations/Landing/InstalledIntegrations'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'
import { Separator } from 'ui'

const LandingPage: NextPageWithLayout = () => {
  return (
    <div>
      <div className="p-9">
        <h1 className="text-lg">Integrations</h1>
        <p className="text-sm text-foreground-lighter">
          Enhance your Supabase project with a wide variety of integrations.
        </p>
      </div>
      <Separator />
      <InstalledIntegrations />
      <Separator />
      <AvailableIntegrations />
    </div>
  )
}

LandingPage.getLayout = (page) => {
  return (
    <ProjectLayout title={'Integrations'} product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default LandingPage
