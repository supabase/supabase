import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'
import type { ResourceWarning } from '@/data/usage/resource-warnings-query'

const COMPUTE_UPGRADE_METRICS = ['disk_io', 'cpu', 'ram']
const COMPUTE_UPGRADE_WARNING_TYPES = [
  'disk_io_exhaustion',
  'cpu_exhaustion',
  'memory_and_swap_exhaustion',
]

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

export const isComputeUpgradeWarning = (
  metric: string | null | undefined,
  activeWarnings: string[]
) =>
  (metric !== null && metric !== undefined && COMPUTE_UPGRADE_METRICS.includes(metric)) ||
  (activeWarnings.length > 1 &&
    activeWarnings.every((warning) => COMPUTE_UPGRADE_WARNING_TYPES.includes(warning)))

export const getResourceWarningCorrectionUrl = ({
  metric,
  activeWarnings,
  projectRef,
  isFreePlan,
  organizationSlug,
}: {
  metric: string | null | undefined
  activeWarnings: string[]
  projectRef?: string
  isFreePlan: boolean
  organizationSlug?: string
}) => {
  const isComputeUpgradeMetric = isComputeUpgradeWarning(metric, activeWarnings)

  if (isComputeUpgradeMetric && isFreePlan) {
    return `/org/${organizationSlug ?? '_'}/billing?panel=subscriptionPlan&source=resource_exhaustion_banner`
  }

  if (isComputeUpgradeMetric && activeWarnings.length > 1) {
    return `/project/${projectRef ?? 'default'}/settings/infrastructure`
  }

  const correctionUrlVariants: Record<string, string | undefined> = {
    disk_space: '/project/[ref]/settings/infrastructure',
    read_only: '/project/[ref]/settings/infrastructure',
    disk_io: '/project/[ref]/settings/infrastructure',
    cpu: '/project/[ref]/settings/infrastructure',
    ram: '/project/[ref]/settings/infrastructure',
    auth_email_rate_limit: '/project/[ref]/auth/rate-limits',
    auth_restricted_email_sending: '/project/[ref]/auth/smtp',
  }

  const correctionUrl =
    metric === undefined
      ? undefined
      : metric === null
        ? '/project/[ref]/settings/infrastructure'
        : (correctionUrlVariants[metric] ?? `/project/[ref]/settings/infrastructure#${metric}`)

  return correctionUrl?.replace('[ref]', projectRef ?? 'default')
}
