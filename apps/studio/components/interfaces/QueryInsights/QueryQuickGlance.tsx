import { useMemo } from 'react'
import { useQueryInsightsGlanceQuery } from 'data/query-insights/query-glance-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, CardContent } from 'ui'
import { Database, BarChart3, Clock, AlertCircle } from 'lucide-react'

export const QueryQuickGlance = () => {
  const { data: project } = useSelectedProjectQuery()

  // Memoize time range to prevent constant re-renders
  const { startTime, endTime } = useMemo(() => {
    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    return { startTime, endTime }
  }, []) // Empty dependency array - only calculate once

  const {
    data: glanceData,
    isLoading,
    error,
  } = useQueryInsightsGlanceQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    startTime,
    endTime,
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
            value: glanceData.unique_queries || 0,
          },
          {
            label: 'Total',
            value: glanceData.total_queries || 0,
          },
        ],
      },
      {
        icon: <Clock size={14} strokeWidth={1} />,
        title: 'Query Time',
        values: [
          {
            label: 'Average',
            value: glanceData.avg_query_time?.toFixed(2) || 0,
          },
          {
            label: 'Max',
            value: glanceData.max_query_time?.toFixed(2) || 0,
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
            value: glanceData.avg_error_rate?.toFixed(2) || 0,
          },
        ],
      },
    ]
  }, [glanceData])

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[134px] bg-surface-100 animate-pulse rounded-lg" />
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
            <div className="flex gap-2 items-center text-foreground-light pt-1">
              <span>{card.icon}</span>
              <span className="text-xs font-mono uppercase truncate max-w-[24ch]">
                {card.title}
              </span>
            </div>
            <div className="flex flex-col w-full divide-y divide-dashed">
              {card.values.map((value, index) => (
                <div key={index} className="text-sm py-2 flex justify-between items-center w-full">
                  <span className="font-mono text-foreground-lighter truncate max-w-[16ch]">
                    {value.label}{' '}
                  </span>
                  <span>{value.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
