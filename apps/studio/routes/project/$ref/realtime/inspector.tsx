import { createFileRoute } from '@tanstack/react-router'

import { RealtimeInspector } from '@/components/interfaces/Realtime/Inspector'

export const Route = createFileRoute('/project/$ref/realtime/inspector')({
  component: RealtimeInspector,
  staticData: {
    realtimeLayoutTitle: 'Realtime Inspector',
  },
})
