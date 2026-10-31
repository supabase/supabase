import type { PropsWithChildren } from 'react'

import { ProjectIntegrationsLayout } from './ProjectIntegrationsLayout'
import { ProjectMarketplaceLayout } from './ProjectMarketplaceLayout'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

export const ProjectIntegrationsLayoutDispatch = ({ children }: PropsWithChildren) => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  if (isMarketplaceEnabled) {
    return <ProjectMarketplaceLayout>{children}</ProjectMarketplaceLayout>
  }
  return <ProjectIntegrationsLayout>{children}</ProjectIntegrationsLayout>
}
