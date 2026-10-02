import { createFileRoute } from '@tanstack/react-router'

import ProjectSettings from '@/pages/project/[ref]/settings/general'

export const Route = createFileRoute('/project/$ref/settings/general')({
  component: SettingsGeneralRoute,
  staticData: { settingsLayoutTitle: 'General' },
})

function SettingsGeneralRoute() {
  return <ProjectSettings dehydratedState={undefined} />
}
