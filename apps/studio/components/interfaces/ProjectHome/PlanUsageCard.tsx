import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from 'ui'

import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import { OrgMetricsUsage, useOrgUsageQuery } from '@/data/usage/org-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrack } from '@/lib/telemetry/track'

type MetricUnit = 'gigabytes' | 'count'

type MetricConfig = {
  key: PricingMetric
  label: string
  unit: MetricUnit
  anchor: string
}

const METRICS: MetricConfig[] = [
  { key: PricingMetric.EGRESS, label: 'Egress', unit: 'gigabytes', anchor: 'egress' },
  {
    key: PricingMetric.DATABASE_SIZE,
    label: 'Database size',
    unit: 'gigabytes',
    anchor: 'databaseSize',
  },
  {
    key: PricingMetric.MONTHLY_ACTIVE_USERS,
    label: 'Monthly active users',
    unit: 'count',
    anchor: 'mau',
  },
  {
    key: PricingMetric.STORAGE_SIZE,
    label: 'File storage',
    unit: 'gigabytes',
    anchor: 'storageSize',
  },
]

const formatCount = (value: number) => value.toLocaleString()

const formatUsagePair = (value: number, limit: number, unit: MetricUnit) => {
  if (unit === 'count') return { value: formatCount(value), limit: formatCount(limit) }
  if (limit < 1) {
    return { value: (value * 1000).toFixed(0), limit: `${(limit * 1000).toFixed(0)} MB` }
  }
  return { value: value === 0 ? '0' : value.toFixed(value < 10 ? 2 : 1), limit: `${limit} GB` }
}

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
      width="16"
      height="16"
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

const PLACEMENT = 'org_projects_list'

const CompactMetricRow = ({
  usageItem,
  config,
  orgSlug,
}: {
  usageItem: OrgMetricsUsage
  config: MetricConfig
  orgSlug: string
}) => {
  const current = usageItem.usage ?? 0
  const limit = usageItem.pricing_free_units ?? 0
  const ratio = limit > 0 ? current / limit : 0
  const isOver = limit > 0 && current >= limit
  const isApproaching = limit > 0 && ratio >= 0.8 && !isOver
  const formatted = formatUsagePair(current, limit, config.unit)

  return (
    <Link
      href={`/org/${orgSlug}/usage#${config.anchor}`}
      className="group/row block hover:bg-surface-200 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 py-2 border-0">
        <div className="flex items-center gap-2 min-w-0">
          <ProgressRing ratio={ratio} isOver={isOver} isApproaching={isApproaching} />
          <span className="text-xs text-foreground-light truncate">{config.label}</span>
        </div>
        <div className="flex items-center shrink-0">
          <span className="text-xs whitespace-nowrap">
            <span className={cn(isOver ? 'text-warning' : 'text-foreground')}>
              {formatted.value}
            </span>
            <span className="text-muted"> / </span>
            <span className="text-foreground-lighter">{formatted.limit}</span>
          </span>
          <ChevronRight
            size={12}
            strokeWidth={1.5}
            className="text-foreground w-0 ml-0 opacity-0 overflow-hidden group-hover/row:w-3 group-hover/row:ml-1 group-hover/row:opacity-100 transition-all"
          />
        </div>
      </div>
    </Link>
  )
}

const SkeletonMetricRow = ({ label }: { label: string }) => (
  <div>
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-4 h-4 rounded-full border-2 border-foreground-muted/40 shrink-0"
          aria-hidden
        />
        <span className="text-xs text-foreground-light truncate">{label}</span>
      </div>
      <div className="h-3 w-16 rounded bg-surface-200 animate-pulse" aria-hidden />
    </div>
  </div>
)

export const PlanUsageCard = () => {
  const track = useTrack()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: usage, isSuccess, isError } = useOrgUsageQuery({ orgSlug: organization?.slug })

  const visibleRows = isSuccess
    ? METRICS.map((config) => {
        const usageItem = usage.usages.find((u) => u.metric === config.key)
        if (!usageItem) return null
        if (!usageItem.available_in_plan) return null
        if (!usageItem.pricing_free_units || usageItem.pricing_free_units <= 0) return null
        return { config, usageItem }
      }).filter((row): row is { config: MetricConfig; usageItem: OrgMetricsUsage } => row !== null)
    : []

  if (isError) return null
  if (isSuccess && visibleRows.length === 0) return null

  return (
    <li className="list-none h-min">
      <div className="group relative flex flex-col gap-y-2">
        <div className="flex items-start justify-between gap-4  pb-2">
          <div className="flex flex-col min-w-0">
            <h5 className="text-sm text-foreground truncate">Free plan usage</h5>
            <p className="text-xs text-foreground-lighter truncate">Current billing cycle</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <UpgradePlanButton
              source={PLACEMENT}
              plan="Pro"
              variant="default"
              onClick={() => track('upgrade_cta_clicked', { placement: PLACEMENT })}
            />
          </div>
        </div>
        <div className="flex flex-col justify-end pb-2 [&>:first-child>*]:border-t-0 divide-y">
          {isSuccess
            ? visibleRows.map(({ config, usageItem }) => (
                <CompactMetricRow
                  key={config.key}
                  usageItem={usageItem}
                  config={config}
                  orgSlug={organization?.slug ?? '_'}
                />
              ))
            : METRICS.map((config) => <SkeletonMetricRow key={config.key} label={config.label} />)}
        </div>
      </div>
    </li>
  )
}
