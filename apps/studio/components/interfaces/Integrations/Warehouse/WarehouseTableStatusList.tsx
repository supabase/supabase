import dayjs from 'dayjs'
import { Badge, Card, CardContent, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
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
      <TooltipTrigger className="text-sm text-foreground-light underline decoration-dotted decoration-foreground-muted/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-foreground-lighter">
        {label}
      </TooltipTrigger>
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
              <span className="flex-1 truncate text-sm">
                <span className="text-foreground-lighter">{table.schema}.</span>
                <span className="text-foreground">{table.name}</span>
              </span>
              <TableLag table={table} />
              {table.warehouse_size_bytes !== undefined && (
                <span className="text-sm text-foreground-light tabular-nums">
                  {formatBytes(table.warehouse_size_bytes)}
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
        <PageSectionTitle>Status</PageSectionTitle>
        <PageSectionDescription>Replication status of the selected tables.</PageSectionDescription>
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
  const syncedTableCount = status.tables.filter((table) => table.state === 'live').length
  const progressDescription =
    status.setup_status === 'setting_up'
      ? 'Creating the replication pipeline. Connection details appear once the first backfill finishes.'
      : `Backfilling selected tables. ${syncedTableCount} of ${status.tables.length} tables synced.`

  return (
    <PageSection className="first:pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Status</PageSectionTitle>
          <PageSectionDescription>Warehouse setup progress.</PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="space-y-4">
        <Admonition
          type="default"
          title="Warehouse is being set up"
          description={progressDescription}
        />
        {status.tables.length > 0 && <WarehouseTableStatusList tables={status.tables} />}
      </PageSectionContent>
    </PageSection>
  )
}
