import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import {
  WarehouseCatalogCredentialsCard,
  WarehouseCatalogEnableCard,
} from './WarehouseCatalogCards'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export const WarehouseCatalogOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) {
    return (
      <div className="px-4 md:px-10 max-w-4xl space-y-4">
        <WarehouseCatalogEnableCard />
        <WarehouseCatalogCredentialsCard />
      </div>
    )
  }

  return (
    <IntegrationOverviewTab hideRequiredExtensionsSection>
      <div className="px-4 md:px-10 max-w-4xl space-y-4">
        <WarehouseCatalogEnableCard />
        <WarehouseCatalogCredentialsCard />
      </div>
    </IntegrationOverviewTab>
  )
}
