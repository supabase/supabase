import { useRouter } from 'next/router'

import { PlatformWebhooksPage } from 'components/interfaces/Platform/Webhooks'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

const ProjectWebhookEndpointSettings: NextPageWithLayout = () => {
  const { query } = useRouter()
  const endpointId = Array.isArray(query.endpointId) ? query.endpointId[0] : query.endpointId

  return <PlatformWebhooksPage scope="project" endpointId={endpointId} />
}

ProjectWebhookEndpointSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>{page}</SettingsLayout>
  </DefaultLayout>
)

export default ProjectWebhookEndpointSettings
