import { Lightbulb, ChevronsUpDown, Expand } from 'lucide-react'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'

import { formatSql } from 'lib/formatSql'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, cn } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
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

  const [isExpanded, setIsExpanded] = useState(false)

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
      <QueryPanelSection className="pt-2 border-b relative">
        <h4 className="mb-4">Query pattern</h4>
        <div
          className={cn(
            'overflow-hidden pb-0 z-0 relative transition-all duration-300',
            isExpanded ? 'h-[348px]' : 'h-[120px]'
          )}
        >
          <SqlMonacoBlock
            value={query}
            height={322}
            lineNumbers="off"
            wrapperClassName={cn('pl-3 bg-surface-100', !isExpanded && 'pointer-events-none')}
          />
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
        </div>
        <div
          className={cn(
            'absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/30 to-transparent h-24 transition-opacity duration-300',
            isExpanded && 'opacity-0 pointer-events-none'
          )}
        />
        <div className="absolute -bottom-[13px] left-0 right-0 w-full flex items-center justify-center z-10">
          <Button
            type="default"
            className="rounded-full"
            icon={<ChevronsUpDown />}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </QueryPanelSection>
      <QueryPanelSection className="pb-3 pt-6">
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
                const percentage = selectedRow?.prop_total_time || 0
                const totalTime = selectedRow?.total_time || 0

                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {percentage && totalTime ? (
                      <p className="flex items-center gap-x-1.5">
                        <span
                          className={cn(
                            'tabular-nums',
                            percentage.toFixed(1) === '0.0' && 'text-foreground-lighter'
                          )}
                        >
                          {percentage.toFixed(1)}%
                        </span>{' '}
                        <span className="text-muted">/</span>{' '}
                        <span
                          className={cn(
                            'tabular-nums',
                            formatDuration(rawValue / 1000) === '0.00s' && 'text-foreground-lighter'
                          )}
                        >
                          {formatDuration(totalTime / 1000)}
                        </span>
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
