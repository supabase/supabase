import { createFileRoute } from '@tanstack/react-router'

import ProjectSettingsIntegrations from '@/pages/project/[ref]/settings/integrations'

export const Route = createFileRoute('/project/$ref/settings/integrations')({
  component: SettingsIntegrationsRoute,
  staticData: { settingsLayoutTitle: 'Integrations' },
})

function SettingsIntegrationsRoute() {
  return <ProjectSettingsIntegrations dehydratedState={undefined} />
}
