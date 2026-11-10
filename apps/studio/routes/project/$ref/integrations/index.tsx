import { createFileRoute } from '@tanstack/react-router'

import { MarketplaceIndex } from '@/components/interfaces/Integrations/Marketplace/MarketplaceIndex'

export const Route = createFileRoute('/project/$ref/integrations/')({
  component: IntegrationsPage,
})

function IntegrationsPage() {
  return <MarketplaceIndex />
}
