import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { cn, ToggleGroup, ToggleGroupItem } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import {
  ALERT_LOG_EVENT_RANGES,
  alertIssueEventsQueryOptions,
  type AlertLogEventRange,
} from '@/data/alert-issues/alert-issue-events-query'
import type { AlertLogEvents } from '@/data/alert-issues/alert-issue.schema'

const RANGE_LABELS: Record<AlertLogEventRange, { short: string; long: string }> = {
  '1h': { short: '1h', long: 'Last hour' },
  '24h': { short: '24h', long: 'Last 24 hours' },
  '7d': { short: '7d', long: 'Last 7 days' },
}

/** Log event timestamps arrive as ISO strings or microseconds since the epoch. */
const toDate = (timestamp: string | number) =>
  typeof timestamp === 'number' ? new Date(timestamp / 1000) : new Date(timestamp)

const LogEventRow = ({ event }: { event: AlertLogEvents['events'][number] }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <li className="border-b border-default last:border-b-0">
      <button
        type="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-3 px-3 py-1.5 text-left font-mono text-xs hover:bg-surface-200"
      >
        <ChevronRightIcon
          size={12}
          className={cn(
            'shrink-0 text-foreground-lighter transition-transform',
            isOpen && 'rotate-90'
          )}
        />
        <span className="shrink-0 text-foreground-lighter">
          {dayjs(toDate(event.timestamp)).format('MMM D HH:mm:ss')}
        </span>
        <span className="truncate text-foreground">{event.event_message ?? ''}</span>
      </button>
      {isOpen && (
        <pre className="overflow-x-auto bg-surface-200 px-3 py-2 text-xs text-foreground-light">
          {JSON.stringify(event.body, null, 2)}
        </pre>
      )}
    </li>
  )
}

const LogEventsBody = ({ data }: { data: AlertLogEvents }) => {
  if (data.total === 0) {
    return <p className="text-sm text-foreground-lighter">No log events in this time range</p>
  }

  const chartData = data.buckets.map((bucket) => ({
    timestamp: bucket.timestamp,
    error_count: bucket.count,
    ok_count: 0,
    warning_count: 0,
  }))

  return (
    <div className="flex flex-col gap-3">
      <div className="h-24">
        <LogsBarChart
          data={chartData}
          hideDateRange
          isFullHeight
          chartConfig={{ error_count: { label: 'Events' } }}
        />
      </div>
      <ul className="overflow-hidden rounded-md border border-default">
        {data.events.map((event) => (
          <LogEventRow key={event.id} event={event} />
        ))}
      </ul>
    </div>
  )
}

type AlertIssueLogEventsProps = { projectRef: string; alertIssueId: string }

/** The log events behind an alert issue, found with its alert issue type's preview LQL. */
export const AlertIssueLogEvents = ({ projectRef, alertIssueId }: AlertIssueLogEventsProps) => {
  const [range, setRange] = useState<AlertLogEventRange>('24h')
  const { data, error, isPending, isError } = useQuery(
    alertIssueEventsQueryOptions({ projectRef, alertIssueId, range })
  )
  const total = data ? `${data.total} ${data.total === 1 ? 'event' : 'events'}` : null

  return (
    <section aria-label="Log events" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-sm text-foreground">Log events</h2>
        {total && <span className="text-sm text-foreground-lighter">{total}</span>}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          className="ml-auto"
          value={range}
          onValueChange={(value: AlertLogEventRange | '') => {
            if (value) setRange(value)
          }}
        >
          {ALERT_LOG_EVENT_RANGES.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              aria-label={RANGE_LABELS[option].long}
              className="px-2 text-xs"
            >
              {RANGE_LABELS[option].short}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {data && <code className="truncate text-xs text-foreground-lighter">{data.lql}</code>}
      {isPending ? (
        <GenericSkeletonLoader />
      ) : isError ? (
        <AlertError error={error} subject="Failed to retrieve log events" />
      ) : data === null ? (
        <p className="text-sm text-foreground-lighter">This alert issue type has no log preview.</p>
      ) : (
        <LogEventsBody data={data} />
      )}
    </section>
  )
}
