import { useRouter } from 'next/router'

import { PlatformWebhooksPage } from '@/components/interfaces/Platform/Webhooks'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from '@/types'

const ProjectWebhookEndpointSettings: NextPageWithLayout = () => {
  const { query } = useRouter()
  const endpointId = Array.isArray(query.endpointId) ? query.endpointId[0] : query.endpointId

  // The key resets the page state (such as delivery page cursors) when the endpoint changes
  return <PlatformWebhooksPage key={endpointId} scope="project" endpointId={endpointId} />
}

ProjectWebhookEndpointSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Webhooks">{page}</SettingsLayout>
  </DefaultLayout>
)

export default ProjectWebhookEndpointSettings
