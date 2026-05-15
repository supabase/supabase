import { PropsWithChildren } from 'react'
import { cn } from 'ui'

import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

interface ConstrainedIntegrationTabScaffoldProps extends PropsWithChildren {
  className?: string
}

/**
 * Handles padding for the new Marketplace and legacy integrations layouts.
 * Legacy layout uses px-6, marketplace uses px-0 as padding is handled by the container.
 * [TODO]: Remove this component when the legacy layout will be deprecated.
 */
export const ConstrainedIntegrationTabScaffold = ({
  children,
  className,
}: ConstrainedIntegrationTabScaffoldProps) => {
  const isMarketplace = useIsMarketplaceEnabled()
  return (
    <div className={cn('w-full py-6 xl:py-10', !isMarketplace && 'px-6 xl:px-10', className)}>
      {children}
    </div>
  )
}
