import { createFileRoute } from '@tanstack/react-router'

import ProjectInfrastructure from '@/pages/project/[ref]/settings/infrastructure'

export const Route = createFileRoute('/project/$ref/settings/infrastructure')({
  component: SettingsInfrastructureRoute,
  staticData: { settingsLayoutTitle: 'Infrastructure' },
})

function SettingsInfrastructureRoute() {
  return <ProjectInfrastructure dehydratedState={undefined} />
}
