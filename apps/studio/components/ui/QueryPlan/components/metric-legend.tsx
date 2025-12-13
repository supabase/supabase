import type { LegendItem } from '../hooks/use-metrics-sidebar-data'
import { cn } from 'ui'

type MetricLegendProps = {
  items: LegendItem[]
}

export const MetricLegend = ({ items }: MetricLegendProps) => {
  if (!items.length) return null

  return (
    <ul className="mb-3 flex items-center justify-center gap-x-3 text-[11px] text-foreground-light">
      {items.map((item) => (
        <li key={item.id} className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
