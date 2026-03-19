import { Info } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { SlotLagMetricKey, SlotLagMetrics } from './ReplicationPipelineStatus.types'
import { getFormattedLagValue } from './ReplicationPipelineStatus.utils'

const SLOT_LAG_FIELDS: {
  key: SlotLagMetricKey
  label: string
  type: 'bytes' | 'duration'
  description: string
}[] = [
  {
    key: 'confirmed_flush_lsn_bytes',
    label: 'WAL Flush lag (size)',
    type: 'bytes',
    description:
      'Bytes between the newest WAL record applied locally and the latest flushed WAL record acknowledged by ETL.',
  },
  {
    key: 'flush_lag',
    label: 'WAL Flush lag (time)',
    type: 'duration',
    description:
      'Time between flushing recent WAL locally and receiving notification that ETL has written and flushed it.',
  },
  {
    key: 'safe_wal_size_bytes',
    label: 'Remaining WAL size',
    type: 'bytes',
    description:
      'Bytes still available to write to WAL before this slot risks entering the "lost" state.',
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
        {SLOT_LAG_FIELDS.map(({ key, label, type }) => {
          const { display } = getFormattedLagValue(type, metrics[key])
          return (
            <span key={`${tableName}-${key}`} className="flex items-center gap-1">
              <span className="uppercase tracking-wide text-[10px] text-foreground-lighter">
                {label}
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
      {SLOT_LAG_FIELDS.map(({ key, label, type, description }) => (
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
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
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
            const { display, detail } = getFormattedLagValue(type, metrics[key])
            return (
              <dd className={`flex flex-col ${valueClasses}`}>
                <span>{display}</span>
                {detail && <span className="text-[11px] text-foreground-lighter">{detail}</span>}
              </dd>
            )
          })()}
        </div>
      ))}
    </dl>
  )
}
