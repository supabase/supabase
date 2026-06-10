import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { SlotLagMetricKey, SlotLagMetrics } from './ReplicationPipelineStatus.types'
import { getFormattedLagValue } from './ReplicationPipelineStatus.utils'

const SLOT_LAG_FIELDS: {
  key: SlotLagMetricKey
  label: string
  type: 'bytes' | 'duration'
  description: string
  // Friendly label to show in place of a literal "0 bytes" when there's nothing to report.
  zeroLabel?: string
}[] = [
  {
    key: 'confirmed_flush_lsn_bytes',
    label: 'Waiting to sync',
    type: 'bytes',
    description:
      "Database changes that haven't reached this destination yet. 0 means it's fully up to date.",
    zeroLabel: 'Caught up',
  },
  {
    key: 'safe_wal_size_bytes',
    label: 'Room before pausing',
    type: 'bytes',
    description:
      'How much more can pile up before syncing pauses and this destination has to be set up again.',
  },
  {
    key: 'flush_lag',
    label: 'Time behind',
    type: 'duration',
    description:
      "How far behind in time the destination is. Only available while it's actively syncing, so it's often blank when idle or caught up.",
  },
]

export const SlotLagMetricsInline = ({
  tableName,
  metrics,
}: {
  tableName: string
  metrics: SlotLagMetrics
}) => {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-foreground">
      <span className="truncate font-medium" title={tableName}>
        {tableName}
      </span>
      <span className="text-foreground-lighter">•</span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-foreground-light">
        {SLOT_LAG_FIELDS.map(({ key, label, type, zeroLabel }) => {
          const value = metrics[key]
          const { display } = getFormattedLagValue(type, value)
          return (
            <span key={`${tableName}-${key}`} className="flex items-center gap-1">
              <span className="uppercase tracking-wide text-[10px] text-foreground-lighter">
                {label}
              </span>
              <span className="text-foreground">
                {zeroLabel && value === 0 ? zeroLabel : display}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export const SlotLagMetricsList = ({
  metrics,
  size = 'default',
  showMetricInfo = true,
}: {
  metrics: SlotLagMetrics
  size?: 'default' | 'compact'
  showMetricInfo?: boolean
}) => {
  const gridClasses =
    size === 'default'
      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-y-4 gap-x-6'
      : 'grid-cols-2 gap-y-2 gap-x-4'

  const labelClasses =
    size === 'default' ? 'text-xs text-foreground-light' : 'text-[11px] text-foreground-lighter'

  const valueClasses =
    size === 'default'
      ? 'text-sm font-medium text-foreground'
      : 'text-xs font-medium text-foreground'

  return (
    <dl className={`grid ${gridClasses}`}>
      {SLOT_LAG_FIELDS.map(({ key, label, type, description, zeroLabel }) => (
        <div key={key} className="flex flex-col gap-0.5">
          <dt className={labelClasses}>
            <span className="inline-flex items-center gap-1">
              {label}
              {showMetricInfo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`What is ${label}`}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
                    >
                      <Info size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                    {description}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          </dt>
          {(() => {
            const value = metrics[key]
            const isZeroLabel = Boolean(zeroLabel) && value === 0
            const { display, detail } = getFormattedLagValue(type, value)
            return (
              <dd className={`flex flex-col ${valueClasses}`}>
                <span>{isZeroLabel ? zeroLabel : display}</span>
                {!isZeroLabel && detail && (
                  <span className="text-[11px] text-foreground-lighter">{detail}</span>
                )}
              </dd>
            )
          })()}
        </div>
      ))}
    </dl>
  )
}
