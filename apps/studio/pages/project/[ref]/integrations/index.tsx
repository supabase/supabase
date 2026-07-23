import { MarketplaceIndex } from '@/components/interfaces/Integrations/Marketplace/MarketplaceIndex'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectMarketplaceLayout } from '@/components/layouts/ProjectMarketplaceLayout'
import type { NextPageWithLayout } from '@/types'

const IntegrationsPage: NextPageWithLayout = () => <MarketplaceIndex />

IntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectMarketplaceLayout>{page}</ProjectMarketplaceLayout>
  </DefaultLayout>
)

export default IntegrationsPage
