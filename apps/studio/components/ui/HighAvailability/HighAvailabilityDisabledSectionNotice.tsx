import { Admonition } from 'ui-patterns/admonition'

import {
  getHighAvailabilityDisabledDescription,
  getHighAvailabilityDisabledTitle,
  useHighAvailability,
} from '@/hooks/misc/useHighAvailability'

interface HighAvailabilityDisabledSectionNoticeProps {
  feature: string
  descriptionSuffix?: string
  title?: string
  description?: string
}

export function HighAvailabilityDisabledSectionNotice({
  feature,
  descriptionSuffix,
  title,
  description,
}: HighAvailabilityDisabledSectionNoticeProps) {
  const { isHighAvailability } = useHighAvailability()

  if (!isHighAvailability) return null

  return (
    <Admonition type="default" title={title ?? getHighAvailabilityDisabledTitle(feature)}>
      <p className="text-sm text-foreground-light">
        {description ??
          getHighAvailabilityDisabledDescription(feature, { suffix: descriptionSuffix })}
      </p>
    </Admonition>
  )
}
