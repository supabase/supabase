import { MarketplaceDetail } from '@/components/interfaces/Integrations/Marketplace/MarketplaceDetail'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectMarketplaceLayout } from '@/components/layouts/ProjectMarketplaceLayout'
import type { NextPageWithLayout } from '@/types'

const IntegrationPage: NextPageWithLayout = () => <MarketplaceDetail />

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectMarketplaceLayout>{page}</ProjectMarketplaceLayout>
  </DefaultLayout>
)

export default IntegrationPage
