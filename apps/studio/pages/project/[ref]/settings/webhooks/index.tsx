import { PlatformWebhooksPage } from 'components/interfaces/Platform/Webhooks'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

const ProjectWebhooksSettings: NextPageWithLayout = () => {
  return <PlatformWebhooksPage scope="project" />
}

ProjectWebhooksSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>{page}</SettingsLayout>
  </DefaultLayout>
)

export default ProjectWebhooksSettings
