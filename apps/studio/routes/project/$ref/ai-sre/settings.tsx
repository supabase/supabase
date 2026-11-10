import { createFileRoute } from '@tanstack/react-router'

import AiSreSettingsPage from '@/pages/project/[ref]/ai-sre/settings'

export const Route = createFileRoute('/project/$ref/ai-sre/settings')({
  component: AiSreSettingsRoute,
  staticData: {
    aiSreLayoutTitle: 'Settings',
  },
})

function AiSreSettingsRoute() {
  return <AiSreSettingsPage dehydratedState={undefined} />
}
