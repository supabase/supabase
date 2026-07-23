import { MarketplaceDetail } from '@/components/interfaces/Integrations/Marketplace/MarketplaceDetail'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayoutDispatch } from '@/components/layouts/ProjectIntegrationsLayoutDispatch'
import type { NextPageWithLayout } from '@/types'

const IntegrationPage: NextPageWithLayout = () => {
  return <MarketplaceDetail />
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayoutDispatch>{page}</ProjectIntegrationsLayoutDispatch>
  </DefaultLayout>
)

export default IntegrationPage
