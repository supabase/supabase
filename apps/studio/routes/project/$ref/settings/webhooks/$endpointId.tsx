import { createFileRoute } from '@tanstack/react-router'

import { PlatformWebhooksPage } from '@/components/interfaces/Platform/Webhooks'

export const Route = createFileRoute('/project/$ref/settings/webhooks/$endpointId')({
  component: ProjectWebhookEndpointSettings,
  staticData: { settingsLayoutTitle: 'Webhooks' },
})

function ProjectWebhookEndpointSettings() {
  const { endpointId } = Route.useParams()

  // The key resets the page state (such as delivery page cursors) when the endpoint changes
  return <PlatformWebhooksPage key={endpointId} scope="project" endpointId={endpointId} />
}
