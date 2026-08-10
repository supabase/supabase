import { createFileRoute } from '@tanstack/react-router'

import ConfigurationDriftPage from '@/pages/project/[ref]/settings/configuration-drift'

export const Route = createFileRoute('/project/$ref/settings/configuration-drift')({
  component: ConfigurationDriftRoute,
  staticData: { settingsLayoutTitle: 'Code configuration' },
})

function ConfigurationDriftRoute() {
  return <ConfigurationDriftPage dehydratedState={undefined} />
}
