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
  /** Anchor id of the matching section on the org usage page. */
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

const formatGigabytes = (value: number) => {
  if (value === 0) return '0 GB'
  if (value < 1) return `${(value * 1000).toFixed(0)} MB`
  return `${value.toFixed(value < 10 ? 2 : 1)} GB`
}

const formatGigabyteLimit = (limit: number) => {
  if (limit < 1) return `${(limit * 1000).toFixed(0)} MB`
  return `${limit} GB`
}

// Show counts in full with thousands separators (e.g. `50,000`) rather than abbreviated
// (`50k`), to match the pricing page and avoid ambiguity around plan limits.
const formatCount = (value: number) => value.toLocaleString()

const formatValue = (value: number, unit: MetricUnit) =>
  unit === 'gigabytes' ? formatGigabytes(value) : formatCount(value)

const formatLimit = (limit: number, unit: MetricUnit) =>
  unit === 'gigabytes' ? formatGigabyteLimit(limit) : formatCount(limit)

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

// The upgrade CTA surface this card represents. Used as the telemetry `source` +
// `placement` value. Kept as a constant so the tracking stays explicit.
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

  return (
    <Link
      href={`/org/${orgSlug}/usage#${config.anchor}`}
      className="group/row block px-4 hover:bg-surface-200 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 py-2 border-t border-dashed">
        <div className="flex items-center gap-2 min-w-0">
          <ProgressRing ratio={ratio} isOver={isOver} isApproaching={isApproaching} />
          <span className="text-[11px] text-foreground-light uppercase font-mono truncate">
            {config.label}
          </span>
        </div>
        <div className="flex items-center shrink-0">
          <span className="text-[11px] font-mono tabular-nums whitespace-nowrap">
            <span className={cn(isOver ? 'text-warning' : 'text-foreground')}>
              {formatValue(current, config.unit)}
            </span>
            <span className="text-muted"> / </span>
            <span className="text-foreground-lighter"> {formatLimit(limit, config.unit)}</span>
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
  <div className="px-4">
    <div className="flex items-center justify-between gap-2 py-2 border-t border-dashed">
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

/**
 * Renders the upgrade CTA's plan-usage card in the org project list (the
 * `org_projects_list` CTA placement). The parent is responsible for gating on free plan —
 * this component only renders the visual sections once usage data is available. Shaped
 * like a `ProjectCard` so it reads as another tile.
 */
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

  // Hide entirely on hard error or when the org has zero applicable metrics — both
  // are extreme edge cases. Otherwise always render the card shell so the layout is
  // reserved from first paint and the usage rows fade in once the query resolves.
  if (isError) return null
  if (isSuccess && visibleRows.length === 0) return null

  return (
    <li className="list-none h-min">
      <div
        className={cn(
          'group relative bg-surface-100 border border-surface rounded-md',
          'flex flex-col gap-y-2'
        )}
      >
        <div className="flex items-center justify-between gap-4 p-4 pb-2">
          <div className="flex flex-col min-w-0">
            <h5 className="text-sm text-foreground truncate">Free plan usage</h5>
            <p className="text-xs text-foreground-lighter truncate">Current billing cycle</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <UpgradePlanButton
              source={PLACEMENT}
              plan="Pro"
              onClick={() => track('upgrade_cta_clicked', { placement: PLACEMENT })}
            />
          </div>
        </div>
        <div className="flex flex-col justify-end pb-2 [&>:first-child>*]:border-t-0">
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
