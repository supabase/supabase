import { cn } from 'ui'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceLogoProps {
  integration: Pick<IntegrationDefinition, 'icon'>
  /** Tailwind size class, e.g. `h-9 w-9` */
  size?: string
  className?: string
}

/**
 * Wraps the integration's logo in a white rounded chip. Mirrors the chip used
 * on the legacy detail page (white background, light border) so partner
 * marks read consistently against both light and dark dashboard themes.
 */
export const MarketplaceLogo = ({
  integration,
  size = 'h-9 w-9',
  className,
}: MarketplaceLogoProps) => (
  <div
    className={cn(
      'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white',
      size,
      className
    )}
  >
    {integration.icon()}
  </div>
)
