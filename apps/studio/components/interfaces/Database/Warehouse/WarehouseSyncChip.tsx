import { Badge } from 'ui'

import type { CopyStatus } from './warehouseDemoStore'

const COPY_STATUS_LABELS: Record<CopyStatus, string> = {
  backfilling: 'Backfilling',
  live: 'Live',
  error: 'Error',
}

const COPY_STATUS_VARIANTS: Record<CopyStatus, 'default' | 'success' | 'destructive'> = {
  backfilling: 'default',
  live: 'success',
  error: 'destructive',
}

const COPY_STATUS_TOOLTIPS: Record<CopyStatus, string> = {
  backfilling:
    'This table’s initial Warehouse copy is in progress. Postgres remains the source of truth for writes.',
  live: 'This table’s Warehouse copy is caught up with the project replication stream.',
  error: 'This table’s Warehouse copy failed to sync. Check replication logs for details.',
}

export function getCopyStatusTooltip(copyStatus: CopyStatus): string {
  return COPY_STATUS_TOOLTIPS[copyStatus]
}

interface WarehouseSyncChipProps {
  copyStatus: CopyStatus
}

export function WarehouseSyncChip({ copyStatus }: WarehouseSyncChipProps) {
  return (
    <Badge variant={COPY_STATUS_VARIANTS[copyStatus]} className="w-fit">
      {COPY_STATUS_LABELS[copyStatus]}
    </Badge>
  )
}
