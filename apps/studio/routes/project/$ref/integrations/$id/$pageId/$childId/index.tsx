import { createFileRoute } from '@tanstack/react-router'

import IntegrationPage from '@/pages/project/[ref]/integrations/[id]/[pageId]/[childId]/index'

export const Route = createFileRoute('/project/$ref/integrations/$id/$pageId/$childId/')({
  component: IntegrationChildIdRoute,
})

function IntegrationChildIdRoute() {
  return <IntegrationPage dehydratedState={undefined} />
}
