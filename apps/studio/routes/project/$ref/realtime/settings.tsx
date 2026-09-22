import { createFileRoute } from '@tanstack/react-router'

import RealtimeSettingsPage from '@/pages/project/[ref]/realtime/settings'

export const Route = createFileRoute('/project/$ref/realtime/settings')({
  component: RealtimeSettingsRoute,
  staticData: {
    realtimeLayoutTitle: 'Realtime Settings',
  },
})

function RealtimeSettingsRoute() {
  return <RealtimeSettingsPage dehydratedState={undefined} />
}
