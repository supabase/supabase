import dayjs from 'dayjs'
import { Info } from 'lucide-react'
import { type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { SlotLagMetricKey, SlotLagMetrics } from './ReplicationPipelineStatus.types'
import { getFormattedLagValue } from './ReplicationPipelineStatus.utils'
import { SlotConnectionIndicator, SlotStatusBadge } from './SlotStatus'

interface SlotLagField {
  key: SlotLagMetricKey
  label: string
  type: 'bytes' | 'duration'
  description: ReactNode
  // Friendly label to show in place of a literal "0 bytes" when there's nothing to report.
  zeroLabel?: string
  // Friendly label to show when the value is null/absent (e.g. unlimited WAL retention).
  nullLabel?: string
  // Optional hover text for the value, derived from the raw value (e.g. an absolute timestamp).
  getValueTooltip?: (value: number) => string
}

const SLOT_LAG_FIELDS: SlotLagField[] = [
  {
    key: 'confirmed_flush_lsn_bytes',
    label: 'Waiting to sync',
    type: 'bytes',
    description: "Changes in your database the pipeline hasn't synced yet.",
    zeroLabel: 'Caught up',
  },
  {
    key: 'safe_wal_size_bytes',
    label: 'Room before pausing',
    type: 'bytes',
    description: (
      <>
        How much more can pile up before the pipeline has to be set up again. Controlled by the{' '}
        <code className="text-code-inline">max_slot_wal_keep_size</code> setting.
      </>
    ),
    nullLabel: 'Unlimited',
  },
  {
    key: 'reply_time_lag',
    label: 'Last check-in',
    type: 'duration',
    description: 'Time since the pipeline last reported back to your database.',
    zeroLabel: 'Just now',
    // reply_time_lag is "milliseconds ago", so the absolute time is now minus that, in local time.
    getValueTooltip: (ms) => dayjs().subtract(ms, 'millisecond').format('MMM D, YYYY, h:mm:ss A'),
  },
]

// Resolves a field's value into a display string (+ optional precise detail), honoring the
// friendly zero/null labels before falling back to the formatted byte/duration value.
const getFieldDisplay = (field: SlotLagField, value: number | null | undefined) => {
  if (value == null) return { display: field.nullLabel ?? 'n/a', detail: undefined }
  if (field.zeroLabel && value === 0) return { display: field.zeroLabel, detail: undefined }
  return getFormattedLagValue(field.type, value)
}

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
      <SlotConnectionIndicator isActive={metrics.active} context="table" />
      <span className="h-3.5 w-px bg-border" />
      {metrics.wal_status && <SlotStatusBadge status={metrics.wal_status} context="table" />}
      <span className="h-3.5 w-px bg-border" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-foreground-light">
        {SLOT_LAG_FIELDS.map((field) => {
          const { display } = getFieldDisplay(field, metrics[field.key])
          return (
            <span key={`${tableName}-${field.key}`} className="flex items-baseline gap-1">
              <span className="uppercase tracking-wide text-[10px] text-foreground-lighter">
                {field.label}
              </span>
              <span className="text-foreground">{display}</span>
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
      {SLOT_LAG_FIELDS.map((field) => {
        const rawValue = metrics[field.key]
        const { display, detail } = getFieldDisplay(field, rawValue)
        const valueTooltip =
          field.getValueTooltip && typeof rawValue === 'number'
            ? field.getValueTooltip(rawValue)
            : undefined
        return (
          <div key={field.key} className="flex flex-col gap-0.5">
            <dt className={labelClasses}>
              <span className="inline-flex items-center gap-1">
                {field.label}
                {showMetricInfo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`What is ${field.label}`}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
                      >
                        <Info size={12} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                      {field.description}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </dt>
            <dd className={`flex flex-col ${valueClasses}`}>
              {valueTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-fit cursor-default">{display}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {valueTooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span>{display}</span>
              )}
              {detail && <span className="text-[11px] text-foreground-lighter">{detail}</span>}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
