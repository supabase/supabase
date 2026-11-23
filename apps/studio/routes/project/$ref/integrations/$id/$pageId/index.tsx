import { createFileRoute } from '@tanstack/react-router'

import { MarketplaceDetail } from '@/components/interfaces/Integrations/Marketplace/MarketplaceDetail'

export const Route = createFileRoute('/project/$ref/integrations/$id/$pageId/')({
  component: MarketplaceDetail,
})
