import { cn } from 'ui'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface IntegrationLogoProps {
  integration: Pick<IntegrationDefinition, 'icon'>
  size?: string
  className?: string
}

export const IntegrationLogo = ({
  integration,
  size = 'h-9 w-9',
  className,
}: IntegrationLogoProps) => (
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
