import { createFileRoute } from '@tanstack/react-router'

import InspectorPage from '@/pages/project/[ref]/realtime/inspector'

export const Route = createFileRoute('/project/$ref/realtime/inspector')({
  component: RealtimeInspectorRoute,
  staticData: {
    realtimeLayoutTitle: 'Realtime Inspector',
  },
})

function RealtimeInspectorRoute() {
  return <InspectorPage dehydratedState={undefined} />
}
