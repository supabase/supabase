import { PropsWithChildren } from 'react'

import { MarketplaceSidebar } from '@/components/interfaces/Integrations/Marketplace/MarketplaceSidebar'
import { ProjectLayout } from '@/components/layouts/ProjectLayout'
import { withAuth } from '@/hooks/misc/withAuth'

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
