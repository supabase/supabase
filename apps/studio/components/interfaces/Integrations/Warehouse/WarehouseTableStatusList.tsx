import { useParams } from 'common'
import dayjs from 'dayjs'
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
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
import {
  WarehouseSchemaTablePicker,
  type WarehouseSchemaTablePickerProps,
} from './WarehouseSchemaTablePicker'
import { AlertError } from '@/components/ui/AlertError'
import { StateDot, type StateDotVariant } from '@/components/ui/StateDot'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import type { WarehouseSetupStatusResponse } from '@/data/warehouse/warehouse-setup-status-query'
import { WAREHOUSE_PUBLICATION_NAME } from '@/lib/warehouse'

const TABLE_STATE: Record<
  WarehouseSetupTable['state'],
  { label: string; variant: StateDotVariant; isPulsing?: boolean }
> = {
  syncing: { label: 'Backfilling', variant: 'warning', isPulsing: true },
  live: { label: 'Live', variant: 'success' },
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
  if (table.state !== 'live' || table.lag_ms === undefined) return null

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

interface WarehouseTableStatusListProps {
  tables: WarehouseSetupTable[]
}

const WarehouseTableStatusList = ({ tables }: WarehouseTableStatusListProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead className="w-48">Lag</TableHead>
              <TableHead className="w-36">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => {
              const state = TABLE_STATE[table.state]
              return (
                <TableRow key={`${table.schema}.${table.name}`}>
                  <TableCell>
                    <span className="text-foreground-lighter">{table.schema}.</span>
                    <span className="text-foreground">{table.name}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <TableLag table={table} />
                  </TableCell>
                  <TableCell>
                    <StateDot variant={state.variant} isPulsing={state.isPulsing}>
                      {state.label}
                    </StateDot>
                  </TableCell>
                </TableRow>
              )
            })}
            {tables.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-foreground-lighter">
                  No tables are being copied yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export const WarehouseReplicatedTablesSection = ({ tables }: WarehouseTableStatusListProps) => (
  <PageSection className="pt-5!">
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

interface WarehouseEnablingProgressProps extends Pick<
  WarehouseSchemaTablePickerProps,
  'onSubmit' | 'isSubmitting' | 'error'
> {
  status: WarehouseSetupStatusResponse
}

export const WarehouseEnablingProgress = ({
  status,
  onSubmit,
  isSubmitting,
  error,
}: WarehouseEnablingProgressProps) => {
  const { ref: projectRef } = useParams()
  // An empty status table list can also mean the first replication observation is pending.
  // Only offer selection recovery once an existing pipeline's publication is confirmed empty.
  const shouldCheckPublication = status.pipeline_id !== undefined && status.tables.length === 0
  const { data: sources, error: sourcesError } = useReplicationSourcesQuery(
    { projectRef },
    { enabled: shouldCheckPublication }
  )
  const sourceId = sources?.sources.find((source) => source.name === projectRef)?.id
  const { data: publication, error: publicationError } = useReplicationPublicationQuery(
    { projectRef, sourceId, publicationName: WAREHOUSE_PUBLICATION_NAME },
    { enabled: shouldCheckPublication }
  )
  const selectionError = shouldCheckPublication ? (sourcesError ?? publicationError) : null
  const hasEmptyPublication =
    shouldCheckPublication && !selectionError && publication?.tables.length === 0

  const syncedTableCount = status.tables.filter((table) => table.state === 'live').length
  const progressDescription =
    status.setup_status === 'setting_up'
      ? 'Creating the replication pipeline. Connection details appear once the first backfill finishes.'
      : `Backfilling selected tables. ${syncedTableCount} of ${status.tables.length} tables synced.`

  return (
    <>
      <PageSection className="pt-5!">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Status</PageSectionTitle>
            <PageSectionDescription>Warehouse setup progress.</PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent className="space-y-4">
          <Admonition
            type="default"
            title={hasEmptyPublication ? 'No tables selected' : 'Warehouse is being set up'}
            description={
              hasEmptyPublication
                ? 'Select tables below to start replicating data to Warehouse.'
                : progressDescription
            }
          />
          {!!selectionError && (
            <AlertError
              subject="Failed to load replicated tables"
              error={selectionError}
              projectRef={projectRef}
            />
          )}
          {status.tables.length > 0 && <WarehouseTableStatusList tables={status.tables} />}
        </PageSectionContent>
      </PageSection>
      {hasEmptyPublication && (
        <WarehouseSchemaTablePicker
          isEditing
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </>
  )
}
