import { useMemo } from 'react'
import { useQueryInsightsGlanceQuery } from 'data/query-insights/query-glance-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, CardContent } from 'ui'
import { Database, Clock, AlertCircle } from 'lucide-react'
import { formatNumberWithCommas } from './QueryInsights.utils'
import dayjs from 'dayjs'

interface QueryQuickGlanceProps {
  startTime?: string
  endTime?: string
}

export const QueryQuickGlance = ({ startTime, endTime }: QueryQuickGlanceProps) => {
  const { data: project } = useSelectedProjectQuery()

  // Use provided date range or fall back to default
  const { startTime: effectiveStartTime, endTime: effectiveEndTime } = useMemo(() => {
    if (startTime && endTime) {
      return { startTime, endTime }
    }
    // Fallback to last 24 hours if no date range provided
    const fallbackEndTime = new Date().toISOString()
    const fallbackStartTime = dayjs().subtract(24, 'hours').toISOString()
    return { startTime: fallbackStartTime, endTime: fallbackEndTime }
  }, [startTime, endTime])

  // Debug logging
  console.log('QueryQuickGlance Debug:', {
    props: { startTime, endTime },
    effective: { startTime: effectiveStartTime, endTime: effectiveEndTime },
    project: { ref: project?.ref, hasConnectionString: !!project?.connectionString }
  })

  const {
    data: glanceData,
    isLoading,
    error,
  } = useQueryInsightsGlanceQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    startTime: effectiveStartTime,
    endTime: effectiveEndTime,
  })

  // Debug logging for glance results
  console.log('QueryQuickGlance Results:', {
    glanceData,
    isLoading,
    error
  })

  const cards = useMemo(() => {
    if (!glanceData) return []

    return [
      {
        icon: <Database size={14} strokeWidth={1} />,
        title: 'Queries',
        values: [
          {
            label: 'Unique',
            value: formatNumberWithCommas(glanceData.unique_queries),
          },
          {
            label: 'Total',
            value: formatNumberWithCommas(glanceData.total_queries),
          },
        ],
      },
      {
        icon: <Clock size={14} strokeWidth={1} />,
        title: 'Query Time',
        values: [
          {
            label: 'Average',
            value: glanceData.avg_query_time?.toFixed(2) + 'ms' || 0,
          },
          {
            label: 'Max',
            value: glanceData.max_query_time?.toFixed(2) + 'ms' || 0,
          },
        ],
      },
      {
        icon: <AlertCircle size={14} strokeWidth={1} />,
        title: 'Errors',
        values: [
          {
            label: 'Count',
            value: glanceData.error_count || 0,
          },
          {
            label: 'Rate',
            value: glanceData.avg_error_rate?.toFixed(2) + '%' || 0 + '%',
          },
        ],
      },
    ]
  }, [glanceData])

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[130px] bg-surface-100 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error loading query insights: {error.message}</div>
  }

  return (
    <section className="grid grid-cols-3 gap-4 w-full">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col items-start gap-2">
            <div className="flex gap-2 items-center text-foreground-light">
              <span>{card.icon}</span>
              <span className="text-xs font-mono uppercase truncate max-w-[24ch]">
                {card.title}
              </span>
            </div>
            <div className="flex flex-col w-full divide-y divide-dashed last:[&>div]:pb-0">
              {card.values.map((value, index) => (
                <div key={index} className="text-xs py-2 flex justify-between items-center w-full">
                  <span className="font-mono text-foreground-lighter truncate max-w-[16ch]">
                    {value.label}{' '}
                  </span>
                  <span className="text-base">{value.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
