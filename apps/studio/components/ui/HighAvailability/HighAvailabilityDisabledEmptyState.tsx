import type { LucideIcon } from 'lucide-react'
import { Server } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'

import {
  getHighAvailabilityDisabledDescription,
  getHighAvailabilityDisabledTitle,
} from '@/hooks/misc/useHighAvailability'

interface HighAvailabilityDisabledEmptyStateProps {
  feature: string
  descriptionSuffix?: string
  icon?: LucideIcon | ReactNode
  className?: string
}

export function HighAvailabilityDisabledEmptyState({
  feature,
  descriptionSuffix,
  icon = Server,
  className,
}: HighAvailabilityDisabledEmptyStateProps) {
  return (
    <EmptyStatePresentational
      icon={icon}
      title={getHighAvailabilityDisabledTitle(feature)}
      description={getHighAvailabilityDisabledDescription(feature, { suffix: descriptionSuffix })}
      className={cn('w-full max-w-md mx-auto', className)}
    />
  )
}
