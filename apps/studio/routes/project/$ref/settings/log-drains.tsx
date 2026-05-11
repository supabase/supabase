import { createFileRoute } from '@tanstack/react-router'

import LogDrainsSettings from '@/pages/project/[ref]/settings/log-drains'

export const Route = createFileRoute('/project/$ref/settings/log-drains')({
  component: SettingsLogDrainsRoute,
  staticData: { settingsLayoutTitle: 'Log Drains' },
})

function SettingsLogDrainsRoute() {
  return <LogDrainsSettings dehydratedState={undefined} />
}
