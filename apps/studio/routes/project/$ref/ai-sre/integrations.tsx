import { createFileRoute } from '@tanstack/react-router'

import AiSreIntegrationsPage from '@/pages/project/[ref]/ai-sre/integrations'

export const Route = createFileRoute('/project/$ref/ai-sre/integrations')({
  component: AiSreIntegrationsRoute,
  staticData: {
    aiSreLayoutTitle: 'Integrations',
  },
})

function AiSreIntegrationsRoute() {
  return <AiSreIntegrationsPage dehydratedState={undefined} />
}
