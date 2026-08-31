import { createFileRoute } from '@tanstack/react-router'

import ProjectAddons from '@/pages/project/[ref]/settings/addons'

export const Route = createFileRoute('/project/$ref/settings/addons')({
  component: SettingsAddonsRoute,
  staticData: { settingsLayoutTitle: 'Add-ons' },
})

function SettingsAddonsRoute() {
  return <ProjectAddons dehydratedState={undefined} />
}
