import { Badge } from 'ui'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { WarehouseSetupPanel } from './WarehouseSetupPanel'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsWarehouseProvisioned } from '@/hooks/misc/useIsWarehouseProvisioned'

export const WarehouseOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  const { isProvisioned } = useIsWarehouseProvisioned()

  // The marketplace shell supplies its own padding, so returning the content bare avoids
  // double-padding it.
  if (isMarketplaceEnabled) return <WarehouseSetupPanel />

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
