import type { LucideIcon } from 'lucide-react'
import { Server } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

const DEFAULT_TITLE = 'This feature is unavailable on High Availability projects'
const DEFAULT_DESCRIPTION =
  "We're working to bring this feature to High Availability projects. Contact support if this is blocking your work."

interface HighAvailabilityDisabledEmptyStateProps {
  title?: string
  description?: ReactNode
  icon?: LucideIcon | ReactNode
  className?: string
}

export function HighAvailabilityDisabledEmptyState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  icon = Server,
  className,
}: HighAvailabilityDisabledEmptyStateProps) {
  return (
    <EmptyStatePresentational
      icon={icon}
      title={title}
      description={description}
      className={cn('w-full max-w-md mx-auto', className)}
    />
  )
}
