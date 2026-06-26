import { Badge } from 'ui'

import type { WarehouseMode } from './warehouseDemoStore'

const MODE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres',
  has_warehouse_copy: 'Postgres + Warehouse',
}

const MODE_VARIANTS: Record<WarehouseMode, 'default' | 'warning'> = {
  postgres: 'default',
  has_warehouse_copy: 'warning',
}

interface WarehouseModeChipProps {
  mode: WarehouseMode
  onClick?: () => void
}

export function WarehouseModeChip({ mode, onClick }: WarehouseModeChipProps) {
  return (
    <Badge
      variant={MODE_VARIANTS[mode]}
      className={onClick && mode !== 'postgres' ? 'cursor-pointer hover:opacity-80' : undefined}
      onClick={onClick}
    >
      {MODE_LABELS[mode]}
    </Badge>
  )
}
