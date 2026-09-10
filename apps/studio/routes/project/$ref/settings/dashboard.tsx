import { createFileRoute } from '@tanstack/react-router'

import Preferences from '@/pages/project/[ref]/settings/dashboard'

export const Route = createFileRoute('/project/$ref/settings/dashboard')({
  component: SettingsDashboardRoute,
  staticData: { settingsLayoutTitle: 'General' },
})

function SettingsDashboardRoute() {
  return <Preferences dehydratedState={undefined} />
}
