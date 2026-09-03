import { createFileRoute } from '@tanstack/react-router'

import IntegrationPage from '@/pages/project/[ref]/integrations/[id]/[pageId]/index'

export const Route = createFileRoute('/project/$ref/integrations/$id/$pageId/')({
  component: IntegrationPageIdRoute,
})

function IntegrationPageIdRoute() {
  return <IntegrationPage dehydratedState={undefined} />
}
