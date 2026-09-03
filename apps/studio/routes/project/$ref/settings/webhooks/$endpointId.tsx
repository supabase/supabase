import { createFileRoute } from '@tanstack/react-router'

import ProjectWebhookEndpointSettings from '@/pages/project/[ref]/settings/webhooks/[endpointId]'

export const Route = createFileRoute('/project/$ref/settings/webhooks/$endpointId')({
  component: SettingsWebhooksEndpointRoute,
  staticData: { settingsLayoutTitle: 'Webhooks' },
})

function SettingsWebhooksEndpointRoute() {
  return <ProjectWebhookEndpointSettings dehydratedState={undefined} />
}
