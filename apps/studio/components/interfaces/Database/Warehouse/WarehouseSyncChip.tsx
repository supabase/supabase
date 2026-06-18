import { Badge } from 'ui'

import type { SyncState } from './warehouseDemoStore'

const SYNC_LABELS: Record<SyncState, string> = {
  syncing: 'Syncing',
  live: 'Live',
  error: 'Error',
}

const SYNC_VARIANTS: Record<SyncState, 'default' | 'success' | 'destructive'> = {
  syncing: 'default',
  live: 'success',
  error: 'destructive',
}

export function WarehouseSyncChip({ syncState }: { syncState: SyncState }) {
  return (
    <Badge variant={SYNC_VARIANTS[syncState]} className="w-fit">
      {SYNC_LABELS[syncState]}
    </Badge>
  )
}
