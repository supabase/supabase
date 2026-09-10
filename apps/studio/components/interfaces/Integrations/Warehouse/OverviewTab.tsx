import { Badge } from 'ui'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { WarehouseSetupPanel } from './WarehouseSetupPanel'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsWarehouseProvisioned } from '@/hooks/misc/useIsWarehouseProvisioned'

export const WarehouseOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  const { isProvisioned } = useIsWarehouseProvisioned()

  if (isMarketplaceEnabled) {
    return (
      <div className="px-4 md:px-10 max-w-4xl space-y-4">
        <WarehouseSetupPanel />
      </div>
    )
  }

  return (
    <IntegrationOverviewTab
      status={isProvisioned ? <Badge variant="success">Enabled</Badge> : undefined}
    >
      <div className="px-4 md:px-10 max-w-4xl space-y-4">
        <WarehouseSetupPanel />
      </div>
    </IntegrationOverviewTab>
  )
}
