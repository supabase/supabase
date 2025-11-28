import React, { useMemo } from 'react'

import { Skeleton } from 'ui'
import { useQueryPerformanceQuery } from '../Reports/Reports.queries'

export const QueryPerformanceMetrics = () => {
  const { data: queryMetrics, isLoading } = useQueryPerformanceQuery({
    preset: 'queryMetrics',
  })

  const stats = useMemo(() => {
    return [
      {
        title: queryMetrics?.[0]?.slow_queries === 1 ? 'Slow Query' : 'Slow Queries',
        value: queryMetrics?.[0]?.slow_queries || '0',
      },
      {
        title: 'Cache Hit Rate',
        value: queryMetrics?.[0]?.cache_hit_rate || '0%',
      },
      {
        title: 'Avg. Rows Per Call',
        value: queryMetrics?.[0]?.avg_rows_per_call || '0',
      },
    ]
  }, [queryMetrics])

  return (
    <section className="px-6 pt-2 pb-4 flex flex-wrap gap-x-6 gap-y-2 w-full">
      {stats.map((card, i) => (
        <React.Fragment key={i}>
          <div className="flex items-baseline gap-2 heading-subSection text-foreground-light">
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <>
                <span className="text-foreground">{card.value}</span>
                <span>{card.title}</span>
              </>
            )}
          </div>
          {i < stats.length - 1 && <span className="text-foreground-muted">/</span>}
        </React.Fragment>
      ))}
    </section>
  )
}
