import { createFileRoute } from '@tanstack/react-router'

import IntegrationPage from '@/pages/project/[ref]/integrations/[id]/index'

export const Route = createFileRoute('/project/$ref/integrations/$id/')({
  component: IntegrationIdRoute,
})

function IntegrationIdRoute() {
  return <IntegrationPage dehydratedState={undefined} />
}
