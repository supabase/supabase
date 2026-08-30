import { createFileRoute } from '@tanstack/react-router'

import ConfigurationDriftPage from '@/pages/project/[ref]/settings/code-configuration'

export const Route = createFileRoute('/project/$ref/settings/code-configuration')({
  component: CodeConfigurationRoute,
  staticData: { settingsLayoutTitle: 'Code configuration' },
})

function CodeConfigurationRoute() {
  return <ConfigurationDriftPage dehydratedState={undefined} />
}
