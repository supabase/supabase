import type { ReactNode } from 'react'
import { Admonition } from 'ui-patterns/admonition'

import { useHighAvailability } from '@/hooks/misc/useHighAvailability'

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
  const { isHighAvailability } = useHighAvailability()

  if (!isHighAvailability) return null

  return (
    <Admonition type="default" title={title}>
      <p className="text-sm text-foreground-light">{description}</p>
    </Admonition>
  )
}
