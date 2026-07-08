import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { DataApiURLSettings } from './DataApiURLSettings'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export const DataApiOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) return <DataApiURLSettings />

  return (
    <IntegrationOverviewTab>
      <div className="px-4 md:px-10 max-w-4xl space-y-4">
        <DataApiURLSettings />
      </div>
    </IntegrationOverviewTab>
  )
}
