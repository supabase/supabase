import type { PropsWithChildren } from 'react'

import { IntegrationOverviewTab } from './IntegrationOverviewTab'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export const MarketplaceIntegrationOverviewTab = (props: PropsWithChildren) => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) return null
  return <IntegrationOverviewTab>{props.children}</IntegrationOverviewTab>
}
