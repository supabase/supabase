import { Badge } from 'ui'

import type { DataTableColumn } from '../types'

interface BadgeCellProps {
  value: unknown
  badgeMap?: DataTableColumn['badgeMap']
}

export function BadgeCell({ value, badgeMap }: BadgeCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }

  const key = String(value)
  const mapping = badgeMap?.[key]

  if (mapping) {
    return (
      <Badge variant={mapping.variant && 'default'} className="leading-none">
        {mapping.label}
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="text-[11px] leading-none">
      {key}
    </Badge>
  )
}
