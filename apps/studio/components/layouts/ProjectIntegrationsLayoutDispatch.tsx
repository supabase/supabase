import { useFlag } from 'common'
import type { PropsWithChildren } from 'react'

import { ProjectIntegrationsLayout } from './ProjectIntegrationsLayout'
import { ProjectMarketplaceLayout } from './ProjectMarketplaceLayout'

/**
 * Picks between the legacy `ProjectIntegrationsLayout` and the new
 * `ProjectMarketplaceLayout` based on the `marketplaceIntegrations` flag.
 * Lives outside both layouts so the legacy implementation stays untouched
 * and we can flip between them without code-path drift.
 */
export const ProjectIntegrationsLayoutDispatch = ({ children }: PropsWithChildren) => {
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')
  if (isMarketplaceEnabled) {
    return <ProjectMarketplaceLayout>{children}</ProjectMarketplaceLayout>
  }
  return <ProjectIntegrationsLayout>{children}</ProjectIntegrationsLayout>
}
