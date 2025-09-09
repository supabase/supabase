import { useMemo } from 'react'

import { Card, CardContent } from 'ui'
import { Database, Clock, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'

export const QueryPerformanceGlance = () => {
  const cards = useMemo(() => {
    return [
      {
        icon: <Database size={14} strokeWidth={1} />,
        title: 'Queries',
        values: [
          {
            label: 'Most time consuming',
            value: 'here',
          },
          {
            label: 'Slow queries',
            value: 'here',
          },
        ],
      },
      {
        icon: <Clock size={14} strokeWidth={1} />,
        title: 'Calls',
        values: [
          {
            label: 'Unique',
            value: 'here',
          },
          {
            label: 'Unique',
            value: 'here',
          },
        ],
      },
      {
        icon: <AlertCircle size={14} strokeWidth={1} />,
        title: 'Cache hits',
        values: [
          {
            label: 'Hits',
            value: 'here',
          },
          {
            label: 'Misses',
            value: 'here',
          },
        ],
      },
    ]
  }, [])
  return (
    <div className="pb-4 pt-0 px-6">
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
                  <div
                    key={index}
                    className="text-xs py-2 flex justify-between items-center w-full"
                  >
                    <span className="font-mono text-foreground-lighter truncate max-w-[16ch]">
                      {value.label}{' '}
                    </span>
                    <span className="text-sm">{value.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
