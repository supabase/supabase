import { cn } from 'ui'

import { SlotWalStatus } from './ReplicationPipelineStatus.types'
import { getWalStatusMeta } from './ReplicationPipelineStatus.utils'

export const SLOT_CONNECTION_TOOLTIP =
  "Whether this pipeline's replication slot has a live connection to your database."

export const SLOT_STATUS_TOOLTIP =
  'How safely your database is keeping the changes this pipeline still needs.'

const DOT_CLASS_NAME: Record<'success' | 'warning' | 'destructive' | 'default', string> = {
  success: 'bg-brand',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  default: 'bg-foreground-muted',
}

const StatusDot = ({ className }: { className: string }) => (
  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', className)} />
)

/** Whether the slot currently has a live replication connection. */
export const SlotConnectionValue = ({ isActive }: { isActive?: boolean }) => (
  <span className="flex items-center gap-x-2">
    <StatusDot className={isActive ? DOT_CLASS_NAME.success : DOT_CLASS_NAME.default} />
    {isActive ? 'Connected' : 'Not connected'}
  </span>
)

/** How safely Postgres is keeping the WAL the slot still needs. */
export const SlotWalStatusValue = ({ status }: { status?: SlotWalStatus }) => {
  const meta = getWalStatusMeta(status)

  return (
    <span className="flex items-center gap-x-2">
      <StatusDot className={DOT_CLASS_NAME[meta.variant]} />
      {meta.label}
    </span>
  )
}
