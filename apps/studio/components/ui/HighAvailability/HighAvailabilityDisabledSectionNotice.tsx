import type { ReactNode } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'

const DEFAULT_TITLE = 'This feature is unavailable on High Availability projects'
const DEFAULT_DESCRIPTION =
  "We're working to bring this feature to High Availability projects. Contact support if this is blocking your work."

interface HighAvailabilityDisabledSectionNoticeProps {
  title?: string
  description?: ReactNode
}

export function HighAvailabilityDisabledSectionNotice({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: HighAvailabilityDisabledSectionNoticeProps) {
  const isHighAvailability = useIsHighAvailability()

  if (!isHighAvailability) return null

  return (
    <Admonition type="default" title={title}>
      <p className="text-sm text-foreground-light">{description}</p>
    </Admonition>
  )
}
