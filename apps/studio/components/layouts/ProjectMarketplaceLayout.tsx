import { PropsWithChildren } from 'react'

import { MarketplaceSidebar } from '@/components/interfaces/Integrations/Marketplace/MarketplaceSidebar'
import { ProjectLayout } from '@/components/layouts/ProjectLayout'
import { withAuth } from '@/hooks/misc/withAuth'

/**
 * Layout for the new Integrations marketplace UI. Gated by the
 * `marketplaceIntegrations` feature flag — page components decide which layout
 * to use based on the flag. Renders a filter-driven sidebar (Discover, type,
 * category, installed) in the slot that the legacy layout uses for the
 * category-link menu.
 */
export const ProjectMarketplaceLayout = withAuth(({ children }: PropsWithChildren) => {
  return (
    <ProjectLayout
      product="Integrations"
      browserTitle={{ section: 'Integrations' }}
      isBlocking={false}
      productMenu={<MarketplaceSidebar />}
      productMenuClassName="p-0"
    >
      {children}
    </ProjectLayout>
  )
})
