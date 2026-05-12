import Link from 'next/link'
import { Card, CardContent, CardHeader, cn } from 'ui'

import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import { OrgMetricsUsage, useOrgUsageQuery } from '@/data/usage/org-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useUpgradeCtaExperiment } from '@/hooks/misc/useUpgradeCtaExperiment'
import { useTrack } from '@/lib/telemetry/track'

type MetricUnit = 'gigabytes' | 'count'

type MetricConfig = {
  key: PricingMetric
  label: string
  unit: MetricUnit
}

const METRICS: MetricConfig[] = [
  { key: PricingMetric.EGRESS, label: 'Egress', unit: 'gigabytes' },
  { key: PricingMetric.DATABASE_SIZE, label: 'Database size', unit: 'gigabytes' },
  { key: PricingMetric.MONTHLY_ACTIVE_USERS, label: 'Monthly active users', unit: 'count' },
  { key: PricingMetric.STORAGE_SIZE, label: 'File storage', unit: 'gigabytes' },
]

const formatGigabytes = (value: number) => {
  if (value === 0) return '0 GB'
  if (value < 1) return `${(value * 1000).toFixed(0)} MB`
  return `${value.toFixed(value < 10 ? 2 : 1)} GB`
}

const formatGigabyteLimit = (limit: number) => {
  if (limit < 1) return `${(limit * 1000).toFixed(0)} MB`
  return `${limit} GB`
}

const formatCount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return value.toLocaleString()
}

const formatCountLimit = (limit: number) => {
  if (limit >= 1_000_000) return `${(limit / 1_000_000).toFixed(0)}M`
  if (limit >= 1_000) return `${(limit / 1_000).toFixed(0)}k`
  return limit.toLocaleString()
}

const formatValue = (value: number, unit: MetricUnit) =>
  unit === 'gigabytes' ? formatGigabytes(value) : formatCount(value)

const formatLimit = (limit: number, unit: MetricUnit) =>
  unit === 'gigabytes' ? formatGigabyteLimit(limit) : formatCountLimit(limit)

const MetricRow = ({ usageItem, config }: { usageItem: OrgMetricsUsage; config: MetricConfig }) => {
  const current = usageItem.usage ?? 0
  const limit = usageItem.pricing_free_units ?? 0
  const ratio = limit > 0 ? Math.min(current / limit, 1) : 0
  const isOver = limit > 0 && current >= limit
  const isApproaching = limit > 0 && current / limit >= 0.8 && !isOver

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground-light">{config.label}</span>
        <span className="font-mono text-xs">
          <span className={cn(isOver ? 'text-warning' : 'text-foreground')}>
            {formatValue(current, config.unit)}
          </span>
          <span className="text-foreground-lighter"> / {formatLimit(limit, config.unit)}</span>
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-surface-200 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isOver ? 'bg-warning-600' : isApproaching ? 'bg-warning' : 'bg-foreground/70'
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}

export const PlanUsageCard = () => {
  const track = useTrack()
  const { data: organization } = useSelectedOrganizationQuery()
  const { variant } = useUpgradeCtaExperiment()
  const enabled = variant === 'home_usage_card'

  const { data: usage, isSuccess } = useOrgUsageQuery({ orgSlug: organization?.slug }, { enabled })

  if (!enabled) return null
  if (!isSuccess) return null

  const visibleRows = METRICS.map((config) => {
    const usageItem = usage.usages.find((u) => u.metric === config.key)
    if (!usageItem) return null
    if (!usageItem.available_in_plan) return null
    if (!usageItem.pricing_free_units || usageItem.pricing_free_units <= 0) return null
    return { config, usageItem }
  }).filter((row): row is { config: MetricConfig; usageItem: OrgMetricsUsage } => row !== null)

  if (visibleRows.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm text-foreground">Organization usage</h3>
          <p className="text-xs text-foreground-lighter">Current billing cycle</p>
        </div>
        <UpgradePlanButton
          source="home_usage_card"
          plan="Pro"
          onClick={() => track('upgrade_cta_clicked', { placement: 'home_usage_card' })}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {visibleRows.map(({ config, usageItem }) => (
          <MetricRow key={config.key} usageItem={usageItem} config={config} />
        ))}
        <Link
          href={`/org/${organization?.slug ?? '_'}/usage`}
          className="text-xs text-foreground-light hover:text-foreground self-end pt-1"
        >
          View all usage &rarr;
        </Link>
      </CardContent>
    </Card>
  )
}
