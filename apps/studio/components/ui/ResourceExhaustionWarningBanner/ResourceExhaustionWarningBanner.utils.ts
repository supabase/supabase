import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'

export const getWarningContent = (
  resourceWarnings: ResourceWarning,
  metric: string,
  contentType: 'cardContent' | 'bannerContent'
) => {
  if (metric === 'is_readonly_mode_enabled') {
    return RESOURCE_WARNING_MESSAGES.is_readonly_mode_enabled.cardContent.warning
  }

  const severity = resourceWarnings[metric as keyof typeof resourceWarnings]
  if (typeof severity !== 'string') return undefined

  return RESOURCE_WARNING_MESSAGES[metric as keyof typeof RESOURCE_WARNING_MESSAGES]?.[
    contentType
  ]?.[severity as 'warning' | 'critical']
}
