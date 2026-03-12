import React, { useMemo } from 'react'
import { parseAsJson, useQueryStates } from 'nuqs'
import { Info } from 'lucide-react'

import { Skeleton, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { useQueryPerformanceQuery } from '../Reports/Reports.queries'
import { NumericFilter } from 'components/interfaces/Reports/v2/ReportsNumericFilter'

export const QueryPerformanceMetrics = () => {
  const { data: queryMetrics, isLoading } = useQueryPerformanceQuery({
    preset: 'queryMetrics',
  })

  const [, setSearchParams] = useQueryStates({
    totalTimeFilter: parseAsJson<NumericFilter | null>((value) =>
      value === null || value === undefined ? null : (value as NumericFilter)
    ),
  })

  const stats = useMemo(() => {
    const slowQueriesTitle = queryMetrics?.[0]?.slow_queries === 1 ? 'Slow Query' : 'Slow Queries'
    const slowQueriesValue = queryMetrics?.[0]?.slow_queries || '0'

    return [
      {
        title: slowQueriesTitle,
        value: slowQueriesValue,
        onClick: () => {
          setSearchParams({
            totalTimeFilter: {
              operator: '>',
              value: 1000,
            } as NumericFilter,
          })
        },
      },
      {
        title: 'Cache Hit Rate',
        value: queryMetrics?.[0]?.cache_hit_rate || '0%',
        tooltip:
          'Percentage of data read from cache vs disk. Higher is better - it means faster queries and less database load.',
      },
      {
        title: 'Avg. Rows Per Call',
        value: queryMetrics?.[0]?.avg_rows_per_call || '0',
        tooltip:
          'Average number of rows returned per query execution. Helps identify queries that return too much or too little data.',
      },
    ]
  }, [queryMetrics, setSearchParams])

  return (
    <section className="px-6 pt-2 pb-4 flex flex-wrap gap-x-6 gap-y-2 w-full">
      {stats.map((card, i) => (
        <React.Fragment key={i}>
          <div
            className={cn('flex items-baseline gap-2 heading-subSection text-foreground-light', {
              'cursor-pointer hover:text-foreground transition-colors': card.onClick,
            })}
            onClick={card.onClick}
          >
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <>
                <span className="text-foreground">{card.value}</span>
                <span className="flex items-center gap-1">
                  {card.title}
                  {(card.title === 'Slow Queries' || card.title === 'Slow Query') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="How are slow queries calculated?"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <Info size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                        Slow queries are those with total execution time (execution time + planning
                        time) greater than 1000ms.
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {card.tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`What is ${card.title}?`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <Info size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                        {card.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </>
            )}
          </div>
          {i < stats.length - 1 && <span className="text-foreground-muted">/</span>}
        </React.Fragment>
      ))}
    </section>
  )
}
