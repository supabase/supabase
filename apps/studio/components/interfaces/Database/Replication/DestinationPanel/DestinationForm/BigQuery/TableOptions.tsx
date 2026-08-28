import { useParams } from 'common'
import { useFieldArray, useWatch, type Control } from 'react-hook-form'
import { Checkbox } from 'ui'
import { GenericSelectionSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { TableOptionRow } from './TableOptionRow'
import { resolvePublishedColumnNames } from './TableOptions.utils'
import { REPLICATION_METADATA_FRESHNESS_MS } from '@/data/replication/constants'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'

const tableLabel = (table: { schema: string; name: string }) => `${table.schema}.${table.name}`

interface TableOptionsProps {
  control: Control<DestinationPanelSchemaType>
}

export const TableOptions = ({ control }: TableOptionsProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const publicationName = useWatch({ control, name: 'publicationName' })

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
  const isLoadingPublicationTables = (isPending || isFetching) && selectedPublication === undefined
  const publicationTables = [...(selectedPublication?.tables ?? [])].sort((a, b) =>
    tableLabel(a).localeCompare(tableLabel(b))
  )

  const { fields, append, remove } = useFieldArray({ control, name: 'tableOptions' })
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
  const tablesNeedingPartitionAncestry = new Set(
    fields.flatMap(({ tableId }) => {
      if (!publicationTableIds.has(tableId) || configuredTablesById.has(tableId)) return []

      const parentId = publicationTablesById.get(tableId)?.partition_parent_id
      return parentId !== null && parentId !== undefined && !configuredTablesById.has(parentId)
        ? [tableId]
        : []
    })
  )
  const shouldResolvePartitionAncestry = tablesNeedingPartitionAncestry.size > 0
  const { data: sourceTables = [], isPending: isSourceTablesPending } = useReplicationTablesQuery(
    { projectRef, sourceId },
    {
      enabled: unavailableTableOptions.length > 0 || shouldResolvePartitionAncestry,
      staleTime: REPLICATION_METADATA_FRESHNESS_MS,
    }
  )
  const sourceTablesById = new Map(sourceTables.map((table) => [table.id, table]))
  const knownSourceTablesById = new Map(
    [...publicationTables, ...sourceTables].map((table) => [table.id, table])
  )

  if (!publicationName) {
    return <p className="text-sm text-foreground-lighter">Select a publication first.</p>
  }

  if (isLoadingPublicationTables && publicationTables.length === 0) {
    return <GenericSelectionSkeletonLoader className="-mx-2 w-auto" />
  }

  if (isPublicationError) {
    return (
      <p className="text-sm text-warning-600">
        The configured table settings could not be verified against the publication.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-y-3">
      {publicationTables.map((table) => {
        const index = fields.findIndex((field) => field.tableId === table.id)
        const isChecked = index !== -1
        const publishedColumnNames =
          selectedPublication?.config.type === 'tables'
            ? resolvePublishedColumnNames(table.id, configuredTablesById, knownSourceTablesById)
            : undefined
        const isPublicationColumnsPending =
          tablesNeedingPartitionAncestry.has(table.id) && isSourceTablesPending

        return (
          <div key={table.id} className="flex flex-col gap-y-3">
            <label className="flex items-center gap-x-2 text-sm">
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    append({ tableId: table.id, partitionBy: undefined, clusterBy: [] })
                  } else if (index !== -1) {
                    remove(index)
                  }
                }}
              />
              {tableLabel(table)}
            </label>
            {isChecked && (
              <TableOptionRow
                control={control}
                index={index}
                isPublicationColumnsError={
                  selectedPublication?.config.type === 'tables' &&
                  publishedColumnNames === null &&
                  !isPublicationColumnsPending
                }
                isPublicationColumnsPending={isPublicationColumnsPending}
                publishedColumnNames={publishedColumnNames ?? undefined}
                tableId={table.id}
              />
            )}
          </div>
        )
      })}

      {unavailableTableOptions.map(({ field, index }) => {
        const sourceTable = sourceTablesById.get(field.tableId)

        return (
          <div key={field.id} className="flex flex-col gap-y-3">
            <label className="flex items-center gap-x-2 text-sm">
              <Checkbox checked onCheckedChange={(checked) => !checked && remove(index)} />
              <span className="text-destructive-600">
                {sourceTable ? tableLabel(sourceTable) : 'Previously configured table'}
                <span className="sr-only"> (no longer in publication)</span>
              </span>
            </label>
          </div>
        )
      })}

      {unavailableTableOptions.length > 0 && (
        <p className="text-sm text-destructive-600">
          Some tables are no longer in the publication.
        </p>
      )}
    </div>
  )
}
