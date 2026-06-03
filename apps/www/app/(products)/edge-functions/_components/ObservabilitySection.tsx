'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { cn } from 'ui'

const RealtimeLogs = dynamic(() => import('~/components/Products/Functions/RealtimeLogs'))
const QueryLogs = dynamic(() => import('~/components/Products/Functions/QueryLogs'))
const Metrics = dynamic(() => import('~/components/Products/Functions/Metrics'))

const cards = [
  {
    id: 'realtime-logs',
    label: 'Realtime logs',
    paragraph: 'Stream logs to the dashboard in realtime with rich metadata to help debugging',
    render: (isActive: boolean) => <RealtimeLogs isActive={isActive} isInView />,
  },
  {
    id: 'log-explorer',
    label: 'Query Logs via Log explorer',
    paragraph: 'Get deeper insights into function behavior by writing SQL queries on function logs',
    render: (isActive: boolean) => <QueryLogs isActive={isActive} isInView />,
  },
  {
    id: 'metrics',
    label: 'Metrics',
    paragraph: 'Dashboards show the health of your functions at all times',
    render: (isActive: boolean) => <Metrics isActive={isActive} />,
  },
]

function ObservabilityCard({
  card,
  className,
}: {
  card: (typeof cards)[number]
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn('flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden ', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex-1 min-h-[285px] overflow-hidden">{card.render(isHovered)}</div>
      <div className="flex flex-col gap-1 px-6 py-5">
        <h4 className="text-foreground text-sm font-medium">{card.label}</h4>
        <p className="text-foreground-lighter text-sm">{card.paragraph}</p>
      </div>
    </div>
  )
}

export function ObservabilitySection() {
  return (
    <div className="py-24 flex flex-col gap-16">
      {/* Header */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
            Debug and monitor with <br />
            <span className="text-foreground">built-in observability</span>
          </h3>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Monitor, debug, and optimize your Edge Functions with realtime logs, queryable log
            explorer, and health dashboards — all built into the Supabase Dashboard.
          </p>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.map((card) => (
            <ObservabilityCard
              key={card.id}
              card={card}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
