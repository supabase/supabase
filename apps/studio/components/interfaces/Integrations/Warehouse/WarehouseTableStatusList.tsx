import dayjs from 'dayjs'
import { Loader2 } from 'lucide-react'
import { Badge, Card, CardContent, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import type { WarehouseSetupTable } from './Warehouse.utils'
import type { WarehouseSetupStatusResponse } from '@/data/warehouse/warehouse-setup-status-query'
import { formatBytes } from '@/lib/helpers'

const TABLE_STATE_BADGE: Record<
  WarehouseSetupTable['state'],
  { label: string; variant: 'warning' | 'success' | 'destructive' }
> = {
  syncing: { label: 'Backfilling', variant: 'warning' },
  live: { label: 'Synced', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
}

/**
 * Replication lag is always non-zero, so a raw figure reads as a problem when it isn't. Anything
 * inside this window is normal streaming latency.
 */
const CAUGHT_UP_THRESHOLD_MS = 10_000

const getLagLabel = (lagMs: number) => {
  if (lagMs < CAUGHT_UP_THRESHOLD_MS) return 'Caught up'
  return `${dayjs.duration(lagMs, 'milliseconds').humanize()} behind`
}

const TableLag = ({ table }: { table: WarehouseSetupTable }) => {
  if (table.lag_ms === undefined) return null

  const label = getLagLabel(table.lag_ms)
  if (!table.last_synced_at) {
    return <span className="text-sm text-foreground-light">{label}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger className="text-sm text-foreground-light">{label}</TooltipTrigger>
      <TooltipContent side="bottom">
        Last synced {dayjs(table.last_synced_at).fromNow()}
      </TooltipContent>
    </Tooltip>
  )
}

export interface WarehouseTableStatusListProps {
  tables: WarehouseSetupTable[]
}

export const WarehouseTableStatusList = ({ tables }: WarehouseTableStatusListProps) => {
  const hasSizes = tables.some((table) => table.warehouse_size_bytes !== undefined)

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {tables.map((table) => {
          const badge = TABLE_STATE_BADGE[table.state]
          return (
            <div
              key={`${table.schema}.${table.name}`}
              className="flex items-center gap-4 px-3 py-2.5"
            >
              <span className="text-sm font-mono text-foreground flex-1 truncate">
                {table.schema}.{table.name}
              </span>
              <TableLag table={table} />
              {hasSizes && (
                <span className="text-sm text-foreground-light tabular-nums">
                  {table.warehouse_size_bytes === undefined
                    ? '—'
                    : formatBytes(table.warehouse_size_bytes)}
                </span>
              )}
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          )
        })}
        {tables.length === 0 && (
          <p className="px-3 py-2.5 text-sm text-foreground-lighter">
            No tables are being copied yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export const WarehouseReplicatedTablesSection = ({ tables }: WarehouseTableStatusListProps) => (
  <PageSection className="first:pt-0">
    <PageSectionMeta>
      <PageSectionSummary>
        <PageSectionTitle>Replication status</PageSectionTitle>
      </PageSectionSummary>
    </PageSectionMeta>
    <PageSectionContent>
      <WarehouseTableStatusList tables={tables} />
    </PageSectionContent>
  </PageSection>
)

export interface WarehouseEnablingProgressProps {
  status: WarehouseSetupStatusResponse
}

export const WarehouseEnablingProgress = ({ status }: WarehouseEnablingProgressProps) => {
  return (
    <div>
      <Admonition
        type="default"
        icon={
          <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-foreground-light" />
        }
        description="Setting up your Warehouse — this can take a few minutes while we backfill selected tables."
        className="mb-5"
      />

      <WarehouseTableStatusList tables={status.tables} />
    </div>
  )
}
