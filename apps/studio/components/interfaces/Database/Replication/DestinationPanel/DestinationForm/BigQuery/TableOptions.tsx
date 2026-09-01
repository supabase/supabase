import { useParams } from 'common'
import { Table2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useFormState, useWatch, type Control } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { isMetadataValueLoading } from '../useRefreshOnOpen'
import { TableOptionDraftRow, TableOptionRow } from './TableOptionRow'
import { findFirstErrorMessage, resolvePublishedColumnNames } from './TableOptions.utils'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'

const tableLabel = (table: { schema: string; name: string }) => `${table.schema}.${table.name}`

const GRANULARITY_SUMMARIES = {
  hour: 'Hourly',
  day: 'Daily',
  month: 'Monthly',
  year: 'Yearly',
} as const

// Returns undefined when a table has nothing applied, so the caller can both render and
// de-emphasise the placeholder rather than comparing against its wording.
const tableOptionSummary = (
  option: NonNullable<DestinationPanelSchemaType['tableOptions']>[number] | undefined
): string | undefined => {
  if (option === undefined) return undefined

  const parts: string[] = []
  const partitionBy = option.partitionBy

  if (partitionBy?.kind === 'time_column') {
    parts.push(
      partitionBy.column
        ? `${GRANULARITY_SUMMARIES[partitionBy.granularity ?? 'day']} by ${partitionBy.column}`
        : 'Time column partitioning'
    )
  } else if (partitionBy?.kind === 'integer_range') {
    parts.push(
      partitionBy.column ? `Integer range by ${partitionBy.column}` : 'Integer range partitioning'
    )
  } else if (partitionBy?.kind === 'ingestion_time') {
    parts.push(
      `${GRANULARITY_SUMMARIES[partitionBy.granularity ?? 'day']} ingestion-time partitioning`
    )
  }

  const clusteringColumnCount = option.clusterBy?.length ?? 0
  if (clusteringColumnCount > 0) {
    parts.push(
      `${clusteringColumnCount} clustering ${clusteringColumnCount === 1 ? 'column' : 'columns'}`
    )
  }

  return parts.length > 0 ? parts.join(' · ') : undefined
}

// Mirrors the row list so the list does not resize when the publication resolves.
const TableOptionsSkeleton = () => (
  <div className="overflow-hidden rounded-md border" aria-hidden="true">
    {['w-2/3', 'w-1/2', 'w-3/4'].map((width, index) => (
      <div key={width} className="flex flex-col gap-1.5 px-3.5 py-3.5 border-t first:border-t-0">
        <ShimmeringLoader className={cn('h-3 py-0', width)} delayIndex={index} />
        <ShimmeringLoader className="h-3 w-1/4 py-0" delayIndex={index} />
      </div>
    ))}
  </div>
)

interface TableOptionsProps {
  control: Control<DestinationPanelSchemaType>
}

export const TableOptions = ({ control }: TableOptionsProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const publicationName = useWatch({ control, name: 'publicationName' })
  const tableOptions = useWatch({ control, name: 'tableOptions' }) ?? []
  const [expandedTableId, setExpandedTableId] = useState<number>()

  const {
    data: selectedPublication,
    isPending,
    isFetching,
    isError: isPublicationError,
    isSuccess: isPublicationSuccess,
  } = useReplicationPublicationQuery({
    projectRef,
    sourceId,
    publicationName,
  })
  const isLoadingPublicationTables = isMetadataValueLoading(
    isPending || isFetching,
    selectedPublication
  )
  const publicationTables = [...(selectedPublication?.tables ?? [])].sort((a, b) =>
    tableLabel(a).localeCompare(tableLabel(b))
  )

  const { fields, append, remove } = useFieldArray({ control, name: 'tableOptions' })
  const { errors } = useFormState({ control, name: 'tableOptions' })
  const publicationTableIds = new Set(publicationTables.map(({ id }) => id))
  const publicationTablesById = new Map(publicationTables.map((table) => [table.id, table]))
  const configuredTables =
    selectedPublication?.config.type === 'tables' ? selectedPublication.config.tables : []
  const configuredTablesById = new Map(configuredTables.map((table) => [table.id, table]))
  const unavailableTableOptions = isPublicationSuccess
    ? fields
        .map((field, index) => ({ field, index }))
        .filter(({ field }) => !publicationTableIds.has(field.tableId))
    : []
  // An expanded row needs its published columns resolved even before it has an entry, so that
  // the first column picker it opens is already filtered correctly.
  const activeTableIds = new Set([
    ...fields.map(({ tableId }) => tableId),
    ...(expandedTableId === undefined ? [] : [expandedTableId]),
  ])
  const tablesNeedingPartitionAncestry = new Set(
    [...activeTableIds].flatMap((tableId) => {
      if (!publicationTableIds.has(tableId) || configuredTablesById.has(tableId)) return []

      const parentId = publicationTablesById.get(tableId)?.partition_parent_id
      return parentId !== null && parentId !== undefined && !configuredTablesById.has(parentId)
        ? [tableId]
        : []
    })
  )
  const shouldResolvePartitionAncestry =
    selectedPublication?.config.type === 'tables' && tablesNeedingPartitionAncestry.size > 0
  const { data: sourceTables = [], isPending: isSourceTablesPending } = useReplicationTablesQuery(
    { projectRef, sourceId },
    {
      enabled: unavailableTableOptions.length > 0 || shouldResolvePartitionAncestry,
    }
  )
  const sourceTablesById = new Map(sourceTables.map((table) => [table.id, table]))
  const knownSourceTablesById = new Map(
    [...publicationTables, ...sourceTables].map((table) => [table.id, table])
  )

  if (!publicationName) {
    return (
      <Admonition
        type="note"
        title="Select a publication"
        description="Choose the publication whose destination tables you want to partition or cluster."
      />
    )
  }

  if (isLoadingPublicationTables) {
    return <TableOptionsSkeleton />
  }

  if (isPublicationError) {
    return (
      <Admonition
        type="warning"
        title="Table settings could not be loaded"
        description="Refresh the page before changing or saving the table layout."
      />
    )
  }

  if (publicationTables.length === 0 && unavailableTableOptions.length === 0) {
    return <p className="text-sm text-foreground-lighter">This publication has no tables.</p>
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="overflow-hidden rounded-md border">
        <Accordion
          type="single"
          collapsible
          value={expandedTableId?.toString() ?? ''}
          onValueChange={(value) => setExpandedTableId(value === '' ? undefined : Number(value))}
        >
          {publicationTables.map((table) => {
            const index = fields.findIndex((field) => field.tableId === table.id)
            const isConfigured = index !== -1
            const summary = tableOptionSummary(isConfigured ? tableOptions[index] : undefined)
            // Errors live inside the collapsed row, so the trigger has to carry them or a
            // blocked save looks like nothing happened at all.
            const rowError = isConfigured
              ? findFirstErrorMessage(errors.tableOptions?.[index])
              : undefined
            const summaryLabel = rowError ?? summary ?? 'Not configured'
            const publishedColumnNames =
              selectedPublication?.config.type === 'tables'
                ? resolvePublishedColumnNames(table.id, configuredTablesById, knownSourceTablesById)
                : undefined
            const isPublicationColumnsPending =
              tablesNeedingPartitionAncestry.has(table.id) && isSourceTablesPending
            const sharedProps = {
              isPublicationColumnsError:
                selectedPublication?.config.type === 'tables' &&
                publishedColumnNames === null &&
                !isPublicationColumnsPending,
              isPublicationColumnsPending,
              publishedColumnNames,
              tableId: table.id,
            }

            return (
              <AccordionItem key={table.id} value={table.id.toString()} className="last:border-b-0">
                <AccordionTrigger
                  aria-label={`${tableLabel(table)}: ${summaryLabel}`}
                  className="px-3.5 py-3 font-normal hover:bg-surface-200 hover:no-underline [&>svg]:text-foreground-lighter"
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <Table2
                      size={16}
                      strokeWidth={1.5}
                      className="shrink-0 text-foreground-lighter"
                    />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {tableLabel(table)}
                      </span>
                      <span
                        className={cn(
                          'truncate text-sm',
                          rowError && 'text-destructive-600',
                          !rowError && summary && 'text-foreground-lighter',
                          // Most rows in a large publication are unconfigured, so keep the
                          // placeholder quieter than the summaries worth scanning for.
                          !rowError && !summary && 'text-foreground-muted'
                        )}
                      >
                        {summaryLabel}
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                {/* Radix unmounts closed content after its exit animation, so this must not be
                    gated on the expanded state as well or the row collapses as an empty box. */}
                <AccordionContent className="[&>div]:p-0">
                  {isConfigured ? (
                    <TableOptionRow
                      control={control}
                      index={index}
                      onClear={() => {
                        remove(index)
                        setExpandedTableId(undefined)
                      }}
                      {...sharedProps}
                    />
                  ) : (
                    <TableOptionDraftRow
                      onCreate={(option) => append({ tableId: table.id, ...option })}
                      {...sharedProps}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        {unavailableTableOptions.map(({ field, index }) => {
          const sourceTable = sourceTablesById.get(field.tableId)

          return (
            <div
              key={field.id}
              className="flex items-center justify-between gap-3 border-t px-3.5 py-3"
            >
              <span className="flex min-w-0 items-center gap-3.5">
                <Table2 size={16} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {sourceTable ? tableLabel(sourceTable) : 'Previously configured table'}
                  </span>
                  <span className="text-sm text-destructive-600">No longer in publication</span>
                </span>
              </span>
              <Button
                type="button"
                variant="default"
                icon={<Trash2 size={14} />}
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
          )
        })}
      </div>

      {unavailableTableOptions.length > 0 && (
        <Admonition
          type="destructive"
          title="Some tables are no longer in the publication"
          description="Remove their configuration before saving."
        />
      )}
    </div>
  )
}
