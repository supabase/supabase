import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import LegacyIntegrationPage from '@/components/interfaces/Integrations/Integration/LegacyIntegrationPage'
import { MarketplaceDetail } from '@/components/interfaces/Integrations/Marketplace/MarketplaceDetail'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayoutDispatch } from '@/components/layouts/ProjectIntegrationsLayoutDispatch'
import type { NextPageWithLayout } from '@/types'

const IntegrationPage: NextPageWithLayout = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  if (isMarketplaceEnabled) return <MarketplaceDetail />
  return <LegacyIntegrationPage />
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayoutDispatch>{page}</ProjectIntegrationsLayoutDispatch>
  </DefaultLayout>
)

export default IntegrationPage
