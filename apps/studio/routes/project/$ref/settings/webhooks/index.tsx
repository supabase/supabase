import { createFileRoute } from '@tanstack/react-router'

import ProjectWebhooksSettings from '@/pages/project/[ref]/settings/webhooks/index'

export const Route = createFileRoute('/project/$ref/settings/webhooks/')({
  component: SettingsWebhooksIndexRoute,
  staticData: { settingsLayoutTitle: 'Webhooks' },
})

function SettingsWebhooksIndexRoute() {
  return <ProjectWebhooksSettings dehydratedState={undefined} />
}
