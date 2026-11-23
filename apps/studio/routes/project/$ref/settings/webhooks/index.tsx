import { createFileRoute } from '@tanstack/react-router'

import { PlatformWebhooksPage } from '@/components/interfaces/Platform/Webhooks'

export const Route = createFileRoute('/project/$ref/settings/webhooks/')({
  component: ProjectWebhooksSettings,
  staticData: { settingsLayoutTitle: 'Webhooks' },
})

function ProjectWebhooksSettings() {
  return <PlatformWebhooksPage scope="project" />
}
