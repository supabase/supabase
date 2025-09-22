import { Lightbulb } from 'lucide-react'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

import { formatSql } from 'lib/formatSql'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, cn } from 'ui'
import { QueryPanelContainer, QueryPanelSection } from './QueryPanel'
import {
  QUERY_PERFORMANCE_COLUMNS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryDetailProps {
  reportType: QUERY_PERFORMANCE_REPORT_TYPES
  selectedRow: any
  onClickViewSuggestion: () => void
}

// Load SqlMonacoBlock (monaco editor) client-side only (does not behave well server-side)
const SqlMonacoBlock = dynamic(
  () => import('./SqlMonacoBlock').then(({ SqlMonacoBlock }) => SqlMonacoBlock),
  {
    ssr: false,
  }
)

export const QueryDetail = ({ selectedRow, onClickViewSuggestion }: QueryDetailProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const report = QUERY_PERFORMANCE_COLUMNS
  const [query, setQuery] = useState(selectedRow?.['query'])

  useEffect(() => {
    if (selectedRow !== undefined) {
      const formattedQuery = formatSql(selectedRow['query'])
      setQuery(formattedQuery)
    }
  }, [selectedRow])

  const formatDuration = (seconds: number) => {
    const dur = dayjs.duration(seconds, 'seconds')

    const minutes = Math.floor(dur.asMinutes())
    const remainingSeconds = dur.seconds() + dur.milliseconds() / 1000

    const parts = []
    if (minutes > 0) parts.push(`${minutes}m`)
    if (remainingSeconds > 0) {
      const formattedSeconds = remainingSeconds.toFixed(2)
      parts.push(`${formattedSeconds}s`)
    }

    return parts.join(' ')
  }

  return (
    <QueryPanelContainer>
      <QueryPanelSection>
        <h4 className="mb-2">Query pattern</h4>
        <SqlMonacoBlock value={query} height={310} lineNumbers="off" wrapperClassName="pl-3" />
        {isLinterWarning && (
          <Alert_Shadcn_
            variant="default"
            className="mt-2 border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand"
          >
            <Lightbulb />
            <AlertTitle_Shadcn_>Suggested optimization: Add an index</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Adding an index will help this query execute faster
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_>
              <Button className="mt-3" onClick={() => onClickViewSuggestion()}>
                View suggestion
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
      </QueryPanelSection>
      <div className="border-t" />
      <QueryPanelSection className="pb-3">
        <h4 className="mb-2">Metadata</h4>
        <ul className="flex flex-col gap-y-3 divide-y divide-dashed">
          {report
            .filter((x) => x.id !== 'query')
            .map((x) => {
              const rawValue = selectedRow?.[x.id]
              const isTime = x.name.includes('time')

              const formattedValue = isTime
                ? typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue)
                  ? `${Math.round(rawValue).toLocaleString()}ms`
                  : 'n/a'
                : rawValue != null
                  ? String(rawValue)
                  : 'n/a'

              if (x.id === 'prop_total_time') {
                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {rawValue ? (
                      <p
                        className={cn(
                          'tabular-nums',
                          rawValue.toFixed(1) === '0.0' && 'text-foreground-lighter'
                        )}
                      >
                        {rawValue.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              if (x.id == 'total_time') {
                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">
                      {x.name + ' '}
                      <span className="text-foreground-lighter">latency</span>
                    </p>
                    {isTime &&
                    typeof rawValue === 'number' &&
                    !isNaN(rawValue) &&
                    isFinite(rawValue) ? (
                      <p
                        className={cn(
                          'tabular-nums',
                          formatDuration(rawValue / 1000) === '0.0s' && 'text-foreground-lighter'
                        )}
                      >
                        {formatDuration(rawValue / 1000)}
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              if (x.id == 'rows_read') {
                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue) ? (
                      <p
                        className={cn('tabular-nums', rawValue === 0 && 'text-foreground-lighter')}
                      >
                        {rawValue.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              const cacheHitRateToNumber = (value: number | string) => {
                if (typeof value === 'number') return value
                return parseFloat(value.toString().replace('%', '')) || 0
              }

              if (x.id === 'cache_hit_rate') {
                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {typeof rawValue === 'string' ? (
                      <p
                        className={cn(
                          cacheHitRateToNumber(rawValue).toFixed(2) === '0.00' &&
                            'text-foreground-lighter'
                        )}
                      >
                        {cacheHitRateToNumber(rawValue).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        %
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              return (
                <li key={x.id} className="flex justify-between pt-3 text-sm">
                  <p className="text-foreground-light">{x.name}</p>
                  <p className={cn('tabular-nums', x.id === 'rolname' && 'font-mono')}>
                    {formattedValue}
                  </p>
                </li>
              )
            })}
        </ul>
      </QueryPanelSection>
    </QueryPanelContainer>
  )
}
