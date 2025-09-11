import { useMemo } from 'react'
import { Database, Clock, Target } from 'lucide-react'

import { Card, CardContent } from 'ui'

export const QueryPerformanceMetrics = () => {
  const cards = useMemo(() => {
    return [
      {
        icon: <Database size={14} strokeWidth={1} />,
        title: 'Slow Queries',
        values: [
          {
            label: 'Unique',
            value: '2',
          },
        ],
      },
      {
        icon: <Clock size={14} strokeWidth={1} />,
        title: 'Average Latency',
        values: [
          {
            label: 'Count',
            value: '0.93s',
          },
        ],
      },
      {
        icon: <Target size={14} strokeWidth={1} />,
        title: 'Cache Hit Rate',
        values: [
          {
            label: 'Average',
            value: '99.9%',
          },
        ],
      },
    ]
  }, [])

  return (
    <section className="px-6 pt-0 pb-4 grid grid-cols-3 gap-4 w-full">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col items-start gap-1 p-4">
            <div className="flex gap-2 items-center text-foreground-light">
              <span>{card.icon}</span>
              <span className="text-xs font-mono uppercase truncate max-w-[24ch]">
                {card.title}
              </span>
            </div>
            <div className="flex flex-col w-full divide-y divide-dashed last:[&>div]:pb-0">
              {card.values.map((value, index) => (
                <div key={index} className=" pb-0 flex justify-between items-center w-full">
                  <span className="text-xl font-mono">{value.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
