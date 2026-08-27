import { useParams } from 'common'
import { useState, type ChangeEvent } from 'react'
import { useController, useFieldArray, useFormState, useWatch, type Control } from 'react-hook-form'
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
import { SelectionListState } from 'ui-patterns/SelectionListState'
import { GenericSelectionSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { defaultPartitionByForKind, parseIntegerInput, shortenPgType } from './BigQuery.utils'
import type { BigQueryPartitionKind } from './BigQuery.utils'
import {
  useReplicationPublicationQuery,
  type ReplicationPublicationData,
} from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTableColumnsQuery } from '@/data/replication/table-columns-query'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'

const PARTITION_KIND_LABELS: Record<BigQueryPartitionKind, string> = {
  none: 'No partitioning',
  time_column: 'Time column',
  integer_range: 'Integer range',
  ingestion_time: 'Ingestion time',
}

type Granularity = 'hour' | 'day' | 'month' | 'year'

const GRANULARITY_LABELS: Record<Granularity, string> = {
  hour: 'Hour',
  day: 'Day',
  month: 'Month',
  year: 'Year',
}

const tableLabel = (table: { schema: string; name: string }) => `${table.schema}.${table.name}`

type SourceTable = ReplicationPublicationData['tables'][number]
type PublicationTableConfig = Extract<
  ReplicationPublicationData['config'],
  { type: 'tables' }
>['tables'][number]

// `undefined` means the matched publication entry includes every column; `null` means the
// ancestry could not be matched reliably and the UI must not claim that the columns are valid.
const resolvePublishedColumnNames = (
  tableId: number,
  configuredTablesById: Map<number, PublicationTableConfig>,
  sourceTablesById: Map<number, SourceTable>
): Set<string> | null | undefined => {
  const visitedTableIds = new Set<number>()
  let currentTableId: number | null | undefined = tableId

  while (currentTableId !== null && currentTableId !== undefined) {
    if (visitedTableIds.has(currentTableId)) return null
    visitedTableIds.add(currentTableId)

    const configuredTable = configuredTablesById.get(currentTableId)
    if (configuredTable) {
      return configuredTable.columns === null || configuredTable.columns === undefined
        ? undefined
        : new Set(configuredTable.columns)
    }
    const sourceTable = sourceTablesById.get(currentTableId)
    if (!sourceTable) return null
    currentTableId = sourceTable.partition_parent_id
  }

  return null
}

const ColumnOption = ({
  name,
  type,
  unavailable,
}: {
  name: string
  type?: string
  unavailable?: boolean
}) => (
  <span
    className={
      unavailable
        ? 'flex items-center gap-x-2 min-w-0 text-destructive-600'
        : 'flex items-center gap-x-2 min-w-0'
    }
  >
    <span className="truncate min-w-0">{name}</span>
    {type && (
      <span
        className={
          unavailable
            ? 'font-mono text-xs shrink-0 text-destructive-600'
            : 'font-mono text-xs shrink-0 text-foreground-lighter'
        }
      >
        {shortenPgType(type)}
      </span>
    )}
  </span>
)

interface TableOptionRowProps {
  control: Control<DestinationPanelSchemaType>
  index: number
  publicationColumnsError?: boolean
  publicationColumnsPending?: boolean
  publishedColumnNames?: Set<string>
  tableId: number
}

const TableOptionRow = ({
  control,
  index,
  publicationColumnsError = false,
  publicationColumnsPending = false,
  publishedColumnNames,
  tableId,
}: TableOptionRowProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const { errors } = useFormState({ control, name: 'tableOptions' })

  const { field: partitionByField } = useController({
    control,
    name: `tableOptions.${index}.partitionBy`,
  })
  const { field: clusterByField } = useController({
    control,
    name: `tableOptions.${index}.clusterBy`,
  })

  const partitionBy = partitionByField.value
  const partitionKind: BigQueryPartitionKind = partitionBy?.kind ?? 'none'
  const partitionByErrorMessage = errors.tableOptions?.[index]?.partitionBy?.message
  const partitionNeedsColumns = partitionKind === 'time_column' || partitionKind === 'integer_range'
  const [shouldLoadColumns, setShouldLoadColumns] = useState(
    partitionNeedsColumns || (clusterByField.value?.length ?? 0) > 0
  )
  const {
    data: columns = [],
    isPending,
    isFetching,
    isError,
    isSuccess,
    refetch: refetchColumns,
  } = useReplicationTableColumnsQuery(
    { projectRef, sourceId, tableId },
    { enabled: shouldLoadColumns, staleTime: 5 * 60 * 1000 }
  )
  const isLoadingColumns = shouldLoadColumns && (isPending || publicationColumnsPending)
  const sourceColumnNames = columns.map((column) => column.name)
  const sourceColumnNameSet = new Set(sourceColumnNames)
  const canUseColumns = !publicationColumnsPending && !publicationColumnsError
  const availableColumnNames = canUseColumns
    ? sourceColumnNames.filter(
        (column) => publishedColumnNames === undefined || publishedColumnNames.has(column)
      )
    : []
  const columnTypeByName = new Map(columns.map((column) => [column.name, column.type]))
  const columnsVerified = isSuccess && canUseColumns
  const partitionColumn = partitionBy && 'column' in partitionBy ? partitionBy.column : undefined
  const configuredColumns = [partitionColumn, ...(clusterByField.value ?? [])].filter(
    (column, index, configuredColumns): column is string =>
      column !== undefined && configuredColumns.indexOf(column) === index
  )
  const unavailableColumns = configuredColumns.filter(
    (column) =>
      columnsVerified &&
      (!sourceColumnNameSet.has(column) ||
        (publishedColumnNames !== undefined && !publishedColumnNames.has(column)))
  )
  const unavailableColumnSet = new Set(unavailableColumns)

  const refreshColumns = () => {
    setShouldLoadColumns(true)
    if (!isFetching) void refetchColumns()
  }
  const refreshColumnsOnOpen = (open: boolean) => {
    if (open) refreshColumns()
  }

  return (
    <div className="flex flex-col gap-y-3 rounded-md border p-3 ml-6">
      <FormItemLayout label="Partitioning" layout="horizontal">
        <Select
          value={partitionKind}
          onValueChange={(kind: BigQueryPartitionKind) => {
            if (kind === 'time_column' || kind === 'integer_range') setShouldLoadColumns(true)
            partitionByField.onChange(defaultPartitionByForKind(kind))
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PARTITION_KIND_LABELS).map(([kind, label]) => (
              <SelectItem key={kind} value={kind}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItemLayout>

      {partitionBy && 'column' in partitionBy && (
        <FormItemLayout label="Partition column" layout="horizontal">
          <Select
            value={partitionBy.column}
            onOpenChange={refreshColumnsOnOpen}
            onValueChange={(column: string) =>
              partitionByField.onChange({ ...partitionBy, column })
            }
          >
            <SelectTrigger
              className={
                unavailableColumnSet.has(partitionBy.column) ? 'border-destructive-600' : undefined
              }
            >
              <ColumnOption
                name={partitionBy.column}
                type={columnTypeByName.get(partitionBy.column)}
                unavailable={unavailableColumnSet.has(partitionBy.column)}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectionListState
                loading={isLoadingColumns}
                error={publicationColumnsError || (isError && columns.length === 0)}
                empty={
                  !isLoadingColumns &&
                  !publicationColumnsError &&
                  !isError &&
                  availableColumnNames.length === 0
                }
                emptyLabel="No published columns available"
                errorLabel="Unable to load columns"
              />
              {availableColumnNames.map((column) => (
                <SelectItem key={column} value={column}>
                  <ColumnOption name={column} type={columnTypeByName.get(column)} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}

      {partitionBy && 'granularity' in partitionBy && (
        <FormItemLayout label="Granularity" layout="horizontal">
          <Select
            value={partitionBy.granularity ?? 'day'}
            onValueChange={(granularity: Granularity) =>
              partitionByField.onChange({ ...partitionBy, granularity })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GRANULARITY_LABELS).map(([granularity, label]) => (
                <SelectItem key={granularity} value={granularity}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}

      {partitionBy?.kind === 'integer_range' && (
        <div className="grid grid-cols-3 gap-x-2">
          <FormItemLayout label="Start">
            <Input
              type="number"
              value={partitionBy.start}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                partitionByField.onChange({
                  ...partitionBy,
                  start: parseIntegerInput(e.target.value, partitionBy.start),
                })
              }
            />
          </FormItemLayout>
          <FormItemLayout label="End">
            <Input
              type="number"
              value={partitionBy.end}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                partitionByField.onChange({
                  ...partitionBy,
                  end: parseIntegerInput(e.target.value, partitionBy.end),
                })
              }
            />
          </FormItemLayout>
          <FormItemLayout label="Interval">
            <Input
              type="number"
              value={partitionBy.interval}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                partitionByField.onChange({
                  ...partitionBy,
                  interval: parseIntegerInput(e.target.value, partitionBy.interval),
                })
              }
            />
          </FormItemLayout>
        </div>
      )}

      <FormItemLayout
        label="Clustering columns"
        layout="horizontal"
        description="Selection order sets the clustering order."
      >
        <MultiSelector
          values={clusterByField.value ?? []}
          onValuesChange={clusterByField.onChange}
          onOpenChange={refreshColumnsOnOpen}
        >
          <MultiSelector.Trigger
            aria-label="Select clustering columns"
            badgeLimit="wrap"
            label="Select columns..."
            renderValue={(column) => (
              <ColumnOption
                name={column}
                type={columnTypeByName.get(column)}
                unavailable={unavailableColumnSet.has(column)}
              />
            )}
          />
          <MultiSelector.Content>
            <MultiSelector.List
              emptyLabel="No published columns available"
              error={publicationColumnsError || (isError && columns.length === 0)}
              errorLabel="Unable to load columns"
              loading={isLoadingColumns}
            >
              {availableColumnNames.map((column) => (
                <MultiSelector.Item key={column} value={column}>
                  <ColumnOption name={column} type={columnTypeByName.get(column)} />
                </MultiSelector.Item>
              ))}
            </MultiSelector.List>
          </MultiSelector.Content>
        </MultiSelector>
      </FormItemLayout>

      {partitionByErrorMessage && (
        <p className="text-sm text-destructive-600">{partitionByErrorMessage}</p>
      )}

      {shouldLoadColumns && (publicationColumnsError || (isError && columns.length === 0)) && (
        <p className="text-sm text-warning-600">
          The configured columns could not be verified against the source and publication.
        </p>
      )}

      {unavailableColumns.length > 0 && (
        <p className="text-sm text-destructive-600 leading-normal">
          Some columns are no longer available.
        </p>
      )}
    </div>
  )
}

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
  const needsPartitionAncestry = tablesNeedingPartitionAncestry.size > 0
  const { data: sourceTables = [], isPending: isSourceTablesPending } = useReplicationTablesQuery(
    { projectRef, sourceId },
    {
      enabled: unavailableTableOptions.length > 0 || needsPartitionAncestry,
      staleTime: 5 * 60 * 1000,
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
        const publicationColumnsPending =
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
                publicationColumnsError={
                  selectedPublication?.config.type === 'tables' &&
                  publishedColumnNames === null &&
                  !publicationColumnsPending
                }
                publicationColumnsPending={publicationColumnsPending}
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
