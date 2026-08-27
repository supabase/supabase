import { useParams } from 'common'
import { useState, type ChangeEvent } from 'react'
import { useController, useFieldArray, useFormState, useWatch, type Control } from 'react-hook-form'
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
import { GenericSelectionSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { defaultPartitionByForKind, parseIntegerInput, shortenPgType } from './BigQuery.utils'
import type { BigQueryPartitionKind } from './BigQuery.utils'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTableColumnsQuery } from '@/data/replication/table-columns-query'

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

const ColumnOption = ({ name, type }: { name: string; type?: string }) => (
  <span className="flex items-center gap-x-2 min-w-0">
    <span className="truncate min-w-0">{name}</span>
    {type && (
      <span className="text-foreground-lighter font-mono text-xs shrink-0">
        {shortenPgType(type)}
      </span>
    )}
  </span>
)

interface TableOptionRowProps {
  control: Control<DestinationPanelSchemaType>
  index: number
  tableId: number
}

const TableOptionRow = ({ control, index, tableId }: TableOptionRowProps) => {
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
    refetch: refetchColumns,
  } = useReplicationTableColumnsQuery(
    { projectRef, sourceId, tableId },
    { enabled: shouldLoadColumns, staleTime: 5 * 60 * 1000 }
  )
  const isLoadingColumns = shouldLoadColumns && (isPending || isFetching) && columns.length === 0
  const columnNames = columns.map((column) => column.name)
  const columnTypeByName = new Map(columns.map((column) => [column.name, column.type]))

  const refreshColumns = () => {
    setShouldLoadColumns(true)
    if (!isFetching) void refetchColumns()
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
            onOpenChange={(open) => {
              if (open) refreshColumns()
            }}
            onValueChange={(column: string) =>
              partitionByField.onChange({ ...partitionBy, column })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingColumns && (
                <GenericSelectionSkeletonLoader className="w-full" variant="select" />
              )}
              {isError && columns.length === 0 && (
                <div className="px-2 py-3 text-xs text-foreground-lighter">
                  Unable to load columns
                </div>
              )}
              {columnNames.map((column) => (
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
          onOpenChange={(open) => {
            if (open) refreshColumns()
          }}
        >
          <MultiSelector.Trigger
            aria-label="Select clustering columns"
            badgeLimit="wrap"
            label="Select columns..."
            renderValue={(column) => (
              <ColumnOption name={column} type={columnTypeByName.get(column)} />
            )}
          />
          <MultiSelector.Content>
            <MultiSelector.List
              error={isError && columns.length === 0}
              errorLabel="Unable to load columns"
              loading={isLoadingColumns}
            >
              {columnNames.map((column) => (
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

  if (!publicationName) {
    return <p className="text-sm text-foreground-lighter">Select a publication first.</p>
  }

  if (isLoadingPublicationTables && publicationTables.length === 0) {
    return <GenericSelectionSkeletonLoader className="-mx-2 w-auto" />
  }

  return (
    <div className="flex flex-col gap-y-3">
      {publicationTables.map((table) => {
        const index = fields.findIndex((field) => field.tableId === table.id)
        const isChecked = index !== -1

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
            {isChecked && <TableOptionRow control={control} index={index} tableId={table.id} />}
          </div>
        )
      })}
    </div>
  )
}
