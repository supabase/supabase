import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { RequiredExtensionsSection } from '../Integration/RequiredExtensionsSection'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export const GraphQLOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) return <RequiredExtensionsSection />
  return <IntegrationOverviewTab />
}
