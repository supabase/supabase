import { createFileRoute } from '@tanstack/react-router'

import AiSreOverviewPage from '@/pages/project/[ref]/ai-sre/index'

export const Route = createFileRoute('/project/$ref/ai-sre/')({
  component: AiSreOverviewRoute,
})

function AiSreOverviewRoute() {
  return <AiSreOverviewPage dehydratedState={undefined} />
}
