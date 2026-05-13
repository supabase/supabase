import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, cn } from 'ui'

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

const RING_RADIUS = 7
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const ProgressRing = ({
  ratio,
  isOver,
  isApproaching,
}: {
  ratio: number
  isOver: boolean
  isApproaching: boolean
}) => {
  const clamped = Math.max(0, Math.min(1, ratio))
  const offset = RING_CIRCUMFERENCE * (1 - clamped)
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="shrink-0"
      aria-hidden="true"
      role="presentation"
    >
      <circle
        cx="9"
        cy="9"
        r={RING_RADIUS}
        strokeWidth="2"
        fill="none"
        stroke="currentColor"
        className="text-foreground-muted/40"
      />
      <circle
        cx="9"
        cy="9"
        r={RING_RADIUS}
        strokeWidth="2"
        fill="none"
        stroke="currentColor"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
        className={cn(
          'transition-[stroke-dashoffset] duration-500',
          isOver ? 'text-warning-600' : isApproaching ? 'text-warning' : 'text-brand'
        )}
      />
    </svg>
  )
}

const MetricRow = ({ usageItem, config }: { usageItem: OrgMetricsUsage; config: MetricConfig }) => {
  const current = usageItem.usage ?? 0
  const limit = usageItem.pricing_free_units ?? 0
  const ratio = limit > 0 ? current / limit : 0
  const isOver = limit > 0 && current >= limit
  const isApproaching = limit > 0 && ratio >= 0.8 && !isOver

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <ProgressRing ratio={ratio} isOver={isOver} isApproaching={isApproaching} />
        <span className="text-sm text-foreground truncate">{config.label}</span>
      </div>
      <span className="text-xs font-mono tabular-nums whitespace-nowrap">
        <span className={cn(isOver ? 'text-warning' : 'text-foreground-light')}>
          {formatValue(current, config.unit)}
        </span>
        <span className="text-foreground-lighter"> / {formatLimit(limit, config.unit)}</span>
      </span>
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
    <section className="w-full">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h3 className="heading-section">Usage</h3>
          <p className="text-xs text-foreground-lighter mt-1">Current billing cycle</p>
        </div>
        <UpgradePlanButton
          source="home_usage_card"
          plan="Pro"
          onClick={() => track('upgrade_cta_clicked', { placement: 'home_usage_card' })}
        />
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0 divide-y divide-border-overlay">
          {visibleRows.map(({ config, usageItem }) => (
            <MetricRow key={config.key} usageItem={usageItem} config={config} />
          ))}
        </CardContent>
      </Card>
      <div className="mt-3 flex justify-end">
        <Link
          href={`/org/${organization?.slug ?? '_'}/usage`}
          className="text-xs text-foreground-light hover:text-foreground inline-flex items-center gap-1"
        >
          View all usage
          <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  )
}
