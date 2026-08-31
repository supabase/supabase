import { createFileRoute } from '@tanstack/react-router'

import IntegrationsPage from '@/pages/project/[ref]/integrations/index'

export const Route = createFileRoute('/project/$ref/integrations/')({
  component: IntegrationsIndexRoute,
})

function IntegrationsIndexRoute() {
  return <IntegrationsPage dehydratedState={undefined} />
}
