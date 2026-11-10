import { createFileRoute } from '@tanstack/react-router'

import { RealtimeInspector } from '@/components/interfaces/Realtime/Inspector'

export const Route = createFileRoute('/project/$ref/realtime/inspector')({
  component: InspectorPage,
  staticData: {
    realtimeLayoutTitle: 'Realtime Inspector',
  },
})

function InspectorPage() {
  return <RealtimeInspector />
}
