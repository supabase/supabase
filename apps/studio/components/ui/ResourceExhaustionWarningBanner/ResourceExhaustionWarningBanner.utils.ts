import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
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

  const ref = projectRef ?? 'default'
  const infrastructurePath = getInfrastructurePath(ref)

  if (isComputeUpgradeMetric && activeWarnings.length > 1) {
    return infrastructurePath
  }

  const correctionUrlVariants: Record<string, string | undefined> = {
    disk_space: infrastructurePath,
    read_only: infrastructurePath,
    disk_io: infrastructurePath,
    cpu: infrastructurePath,
    ram: infrastructurePath,
    auth_email_rate_limit: `/project/${ref}/auth/rate-limits`,
    auth_restricted_email_sending: `/project/${ref}/auth/smtp`,
  }

  if (metric === undefined) return undefined
  if (metric === null) return infrastructurePath
  return correctionUrlVariants[metric] ?? `${infrastructurePath}#${metric}`
}

export type TroubleshootItem =
  | { kind: 'metrics'; warningType: string; menuLabel: string; buttonLabel: string; href: string }
  | { kind: 'docs'; warningType: string; menuLabel: string; buttonLabel: string; href: string }
  | { kind: 'ai'; menuLabel: string; buttonLabel: string }

const resourceListFormatter = new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' })

export const formatResourceList = (labels: string[]): string => resourceListFormatter.format(labels)

export const getResourceWarningLabels = (activeWarnings: string[]): string[] =>
  activeWarnings.flatMap((warningType) => {
    const label = RESOURCE_WARNING_MESSAGES[warningType]?.resourceLabel
    return label === undefined ? [] : [label]
  })

export const applyResourceList = (
  text: string | undefined,
  activeWarnings: string[]
): string | undefined => {
  if (text === undefined) return undefined
  return text.replaceAll(
    '{resources}',
    formatResourceList(getResourceWarningLabels(activeWarnings))
  )
}

export const getResourceWarningMetricsHref = (
  warningType: string,
  projectRef: string,
  showBurstBalanceChart = false
): string | undefined => {
  const chartId =
    warningType === 'disk_io_exhaustion' && showBurstBalanceChart
      ? 'disk-io-burst-balance'
      : RESOURCE_WARNING_MESSAGES[warningType]?.metricsChartId
  if (chartId === undefined) return undefined

  const params = new URLSearchParams({
    chart: chartId,
    isHelper: 'true',
    helperText: REPORT_DATERANGE_HELPER_LABELS.LAST_3_HOURS,
  })
  return `/project/${projectRef}/observability/database?${params}`
}

export const getResourceWarningAiPrompt = (activeWarnings: string[]): string | undefined => {
  if (activeWarnings.length === 1) return RESOURCE_WARNING_MESSAGES[activeWarnings[0]]?.aiPrompt
  return applyResourceList(
    RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.aiPrompt,
    activeWarnings
  )
}

export const getTroubleshootItems = ({
  activeWarnings,
  projectRef,
  aiPrompt,
  showBurstBalanceChart = false,
}: {
  activeWarnings: string[]
  projectRef: string
  aiPrompt: string | undefined
  showBurstBalanceChart?: boolean
}): TroubleshootItem[] => {
  const isSingleWarning = activeWarnings.length === 1

  const metricsItems = activeWarnings.flatMap((warningType): TroubleshootItem[] => {
    const href = getResourceWarningMetricsHref(warningType, projectRef, showBurstBalanceChart)
    const label = RESOURCE_WARNING_MESSAGES[warningType]?.resourceLabel
    if (href === undefined || (!isSingleWarning && label === undefined)) return []
    return [
      {
        kind: 'metrics',
        warningType,
        menuLabel: isSingleWarning ? 'View metrics' : `View ${label} metrics`,
        buttonLabel: 'View metrics',
        href,
      },
    ]
  })

  const docsItems = activeWarnings.flatMap((warningType): TroubleshootItem[] => {
    const href = RESOURCE_WARNING_MESSAGES[warningType]?.docsUrl
    const label = RESOURCE_WARNING_MESSAGES[warningType]?.resourceLabel
    if (href === undefined || (!isSingleWarning && label === undefined)) return []
    return [
      {
        kind: 'docs',
        warningType,
        menuLabel: isSingleWarning ? 'Documentation' : `${label} documentation`,
        buttonLabel: 'Learn more',
        href,
      },
    ]
  })

  const aiItems: TroubleshootItem[] =
    aiPrompt === undefined
      ? []
      : [{ kind: 'ai', menuLabel: 'Ask AI Assistant', buttonLabel: 'Ask AI Assistant' }]

  return [...metricsItems, ...docsItems, ...aiItems]
}
