import type { ChangeEvent } from 'react'
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
import { SelectionListState } from 'ui-patterns/SelectionListState'

import { defaultPartitionByForKind, parseIntegerInput, shortenPgType } from './BigQuery.utils'
import type { BigQueryPartitionKind } from './BigQuery.utils'
import { isPartitionColumnTypeCompatible } from './TableOptions.utils'
import {
  BIGQUERY_MAX_CLUSTERING_COLUMNS,
  BIGQUERY_TIME_PARTITION_GRANULARITIES,
  type BigQueryPartitionBy,
  type BigQueryTimePartitionGranularity,
} from '@/data/replication/create-destination-pipeline-mutation'

const PARTITION_KIND_LABELS: Record<BigQueryPartitionKind, string> = {
  none: 'No partitioning',
  time_column: 'Time column',
  integer_range: 'Integer range',
  ingestion_time: 'Ingestion time',
}

const GRANULARITY_LABELS: Record<BigQueryTimePartitionGranularity, string> = {
  hour: 'Hour',
  day: 'Day',
  month: 'Month',
  year: 'Year',
}

const ColumnOption = ({
  name,
  type,
  isUnavailable = false,
}: {
  name: string
  type?: string
  isUnavailable?: boolean
}) => (
  <span
    className={
      isUnavailable
        ? 'flex items-center gap-x-2 min-w-0 text-destructive-600'
        : 'flex items-center gap-x-2 min-w-0'
    }
  >
    <span className="truncate min-w-0">{name}</span>
    {isUnavailable && <span className="sr-only"> (no longer available)</span>}
    {type && (
      <span
        className={
          isUnavailable
            ? 'font-mono text-xs shrink-0 text-destructive-600'
            : 'font-mono text-xs shrink-0 text-foreground-lighter'
        }
      >
        {shortenPgType(type)}
      </span>
    )}
  </span>
)

export interface ColumnSelectionState {
  availableColumnNames: string[]
  columnTypeByName: ReadonlyMap<string, string>
  isError: boolean
  isLoading: boolean
  onOpenChange: (isOpen: boolean) => void
  unavailableColumnSet: ReadonlySet<string>
}

interface PartitioningFieldsProps {
  columnSelection: ColumnSelectionState
  errors: {
    column?: string
    end?: string
    interval?: string
    start?: string
  }
  onChange: (partitionBy: BigQueryPartitionBy | undefined) => void
  onNeedsColumns: () => void
  partitionBy: BigQueryPartitionBy | undefined
}

export const PartitioningFields = ({
  columnSelection,
  errors,
  onChange,
  onNeedsColumns,
  partitionBy,
}: PartitioningFieldsProps) => {
  const partitionKind: BigQueryPartitionKind = partitionBy?.kind ?? 'none'

  const compatibleColumnNames =
    partitionBy && (partitionBy.kind === 'time_column' || partitionBy.kind === 'integer_range')
      ? columnSelection.availableColumnNames.filter((column) =>
          isPartitionColumnTypeCompatible(
            partitionBy.kind,
            columnSelection.columnTypeByName.get(column)
          )
        )
      : columnSelection.availableColumnNames

  return (
    <>
      <FormItemLayout isReactForm={false} label="Partitioning" layout="vertical">
        <Select
          value={partitionKind}
          onValueChange={(kind: BigQueryPartitionKind) => {
            if (kind === 'time_column' || kind === 'integer_range') onNeedsColumns()
            onChange(defaultPartitionByForKind(kind))
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="bottom" collisionPadding={16}>
            {Object.entries(PARTITION_KIND_LABELS).map(([kind, label]) => (
              <SelectItem key={kind} value={kind}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItemLayout>

      {partitionBy && 'column' in partitionBy && (
        <FormItemLayout
          isReactForm={false}
          label="Partition column"
          layout="vertical"
          error={errors.column}
        >
          <Select
            value={partitionBy.column || undefined}
            onOpenChange={columnSelection.onOpenChange}
            onValueChange={(column: string) => onChange({ ...partitionBy, column })}
          >
            <SelectTrigger
              className={
                columnSelection.unavailableColumnSet.has(partitionBy.column)
                  ? 'border-destructive-600'
                  : undefined
              }
            >
              {partitionBy.column ? (
                <ColumnOption
                  name={partitionBy.column}
                  type={columnSelection.columnTypeByName.get(partitionBy.column)}
                  isUnavailable={columnSelection.unavailableColumnSet.has(partitionBy.column)}
                />
              ) : (
                <SelectValue placeholder="Select a column" />
              )}
            </SelectTrigger>
            <SelectContent side="bottom" collisionPadding={16}>
              <SelectionListState
                isLoading={columnSelection.isLoading}
                isError={columnSelection.isError}
                isEmpty={
                  !columnSelection.isLoading &&
                  !columnSelection.isError &&
                  compatibleColumnNames.length === 0
                }
                emptyLabel="No compatible published columns available"
                errorLabel="Unable to load columns. Open the list again to retry."
              />
              {compatibleColumnNames.map((column) => (
                <SelectItem key={column} value={column}>
                  <ColumnOption name={column} type={columnSelection.columnTypeByName.get(column)} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}

      {partitionBy && 'granularity' in partitionBy && (
        <FormItemLayout isReactForm={false} label="Granularity" layout="vertical">
          <Select
            value={partitionBy.granularity ?? 'day'}
            onValueChange={(granularity: BigQueryTimePartitionGranularity) =>
              onChange({ ...partitionBy, granularity })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" collisionPadding={16}>
              {BIGQUERY_TIME_PARTITION_GRANULARITIES.map((granularity) => (
                <SelectItem key={granularity} value={granularity}>
                  {GRANULARITY_LABELS[granularity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}

      {partitionBy?.kind === 'integer_range' && (
        <div className="grid grid-cols-3 gap-x-2">
          <FormItemLayout
            isReactForm={false}
            label="Start"
            layout="vertical"
            description="Inclusive"
            error={errors.start}
          >
            <Input
              type="text"
              inputMode="numeric"
              value={partitionBy.start}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({
                  ...partitionBy,
                  start: parseIntegerInput(event.target.value, partitionBy.start),
                })
              }
            />
          </FormItemLayout>
          <FormItemLayout
            isReactForm={false}
            label="End"
            layout="vertical"
            description="Exclusive"
            error={errors.end}
          >
            <Input
              type="text"
              inputMode="numeric"
              value={partitionBy.end}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({
                  ...partitionBy,
                  end: parseIntegerInput(event.target.value, partitionBy.end),
                })
              }
            />
          </FormItemLayout>
          <FormItemLayout
            isReactForm={false}
            label="Interval"
            layout="vertical"
            description="Range width"
            error={errors.interval}
          >
            <Input
              type="text"
              inputMode="numeric"
              value={partitionBy.interval}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({
                  ...partitionBy,
                  interval: parseIntegerInput(event.target.value, partitionBy.interval),
                })
              }
            />
          </FormItemLayout>
        </div>
      )}
    </>
  )
}

interface ClusteringFieldsProps {
  clusterBy: string[]
  columnSelection: ColumnSelectionState
  error?: string
  onChange: (columns: string[]) => void
}

export const ClusteringFields = ({
  clusterBy,
  columnSelection,
  error,
  onChange,
}: ClusteringFieldsProps) => {
  const hasReachedColumnLimit = clusterBy.length >= BIGQUERY_MAX_CLUSTERING_COLUMNS

  return (
    <FormItemLayout
      isReactForm={false}
      label="Clustering columns"
      layout="vertical"
      description={`Selection order sets the clustering order. Maximum ${BIGQUERY_MAX_CLUSTERING_COLUMNS} columns.`}
      error={error}
    >
      <MultiSelector
        values={clusterBy}
        onValuesChange={(columns) => {
          if (columns.length <= BIGQUERY_MAX_CLUSTERING_COLUMNS) onChange(columns)
        }}
        onOpenChange={columnSelection.onOpenChange}
      >
        <MultiSelector.Trigger
          aria-label="Select clustering columns"
          badgeLimit="wrap"
          label="Select columns..."
          renderValue={(column) => (
            <ColumnOption
              name={column}
              type={columnSelection.columnTypeByName.get(column)}
              isUnavailable={columnSelection.unavailableColumnSet.has(column)}
            />
          )}
        />
        <MultiSelector.Content>
          <MultiSelector.List
            emptyLabel="No published columns available"
            error={columnSelection.isError}
            errorLabel="Unable to load columns. Open the list again to retry."
            loading={columnSelection.isLoading}
          >
            {columnSelection.availableColumnNames.map((column) => (
              <MultiSelector.Item
                key={column}
                value={column}
                disabled={hasReachedColumnLimit && !clusterBy.includes(column)}
              >
                <ColumnOption name={column} type={columnSelection.columnTypeByName.get(column)} />
              </MultiSelector.Item>
            ))}
          </MultiSelector.List>
        </MultiSelector.Content>
      </MultiSelector>
    </FormItemLayout>
  )
}
