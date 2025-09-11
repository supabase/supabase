import { useMemo } from 'react'
import { Database, Target, List } from 'lucide-react'

import { Card, CardContent } from 'ui'
import { useQueryPerformanceQuery } from '../Reports/Reports.queries'

export const QueryPerformanceMetrics = () => {
  const { data: queryMetrics, isLoading } = useQueryPerformanceQuery({
    preset: 'queryMetrics',
  })

  const cards = useMemo(() => {
    return [
      {
        icon: <Database size={14} strokeWidth={1} />,
        title: 'Slow Queries',
        values: [
          {
            label: 'Count',
            value: queryMetrics?.[0]?.slow_queries || '0',
          },
        ],
      },
      {
        icon: <Target size={14} strokeWidth={1} />,
        title: 'Cache Hit Rate',
        values: [
          {
            label: 'Hit Rate',
            value: queryMetrics?.[0]?.cache_hit_rate || '0%',
          },
        ],
      },
      {
        icon: <List size={14} strokeWidth={1} />,
        title: 'Average Rows Per Call',
        values: [
          {
            label: 'Avg Rows',
            value: queryMetrics?.[0]?.avg_rows_per_call || '0',
          },
        ],
      },
    ]
  }, [queryMetrics])

  return (
    <section className="px-6 pt-0 pb-4 grid grid-cols-3 gap-4 w-full">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col items-start gap-1 p-3">
            <div className="flex gap-2 items-center text-foreground-light">
              <span>{card.icon}</span>
              <span className="text-xs font-mono uppercase truncate max-w-[24ch]">
                {card.title}
              </span>
            </div>
            <div className="flex flex-col w-full divide-y divide-dashed last:[&>div]:pb-0">
              {card.values.map((value, index) => (
                <div key={index} className="pb-0 flex justify-between items-center w-full">
                  <span className="text-lg font-mono">{value.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
