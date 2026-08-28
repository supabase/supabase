import { useParams } from 'common'
import { useState } from 'react'
import { get, useController, useFormState, type Control, type FieldErrors } from 'react-hook-form'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  isMetadataListErrorVisible,
  isMetadataListLoading,
  useRefreshOnOpen,
} from '../useRefreshOnOpen'
import {
  ClusteringFields,
  PartitioningFields,
  type ColumnSelectionState,
} from './TableOptionFields'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTableColumnsQuery } from '@/data/replication/table-columns-query'

const getFieldErrorMessage = (errors: FieldErrors<DestinationPanelSchemaType>, path: string) => {
  const error = get(errors, path)
  return typeof error?.message === 'string' ? error.message : undefined
}

interface TableOptionRowProps {
  control: Control<DestinationPanelSchemaType>
  index: number
  isPublicationColumnsError?: boolean
  isPublicationColumnsPending?: boolean
  publishedColumnNames?: ReadonlySet<string> | null
  tableId: number
}

export const TableOptionRow = ({
  control,
  index,
  isPublicationColumnsError = false,
  isPublicationColumnsPending = false,
  publishedColumnNames,
  tableId,
}: TableOptionRowProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const { errors } = useFormState({ control })

  const { field: partitionByField } = useController({
    control,
    name: `tableOptions.${index}.partitionBy`,
  })
  const { field: clusterByField } = useController({
    control,
    name: `tableOptions.${index}.clusterBy`,
  })

  const partitionBy = partitionByField.value
  const shouldInitiallyLoadColumns =
    partitionBy?.kind === 'time_column' ||
    partitionBy?.kind === 'integer_range' ||
    (clusterByField.value?.length ?? 0) > 0
  const [shouldLoadColumns, setShouldLoadColumns] = useState(shouldInitiallyLoadColumns)
  const {
    data: columns = [],
    isPending,
    isFetching,
    isError,
    isSuccess,
    refetch: refetchColumns,
  } = useReplicationTableColumnsQuery(
    { projectRef, sourceId, tableId },
    { enabled: shouldLoadColumns }
  )

  const isLoadingColumns =
    (shouldLoadColumns && isMetadataListLoading(isPending || isFetching, columns.length)) ||
    isPublicationColumnsPending
  const sourceColumnNames = columns.map((column) => column.name)
  const sourceColumnNameSet = new Set(sourceColumnNames)
  const canUseColumns = !isPublicationColumnsPending && !isPublicationColumnsError
  const availableColumnNames = canUseColumns
    ? sourceColumnNames.filter(
        (column) =>
          publishedColumnNames === undefined ||
          (publishedColumnNames !== null && publishedColumnNames.has(column))
      )
    : []
  const columnTypeByName = new Map(columns.map((column) => [column.name, column.type]))
  const areColumnsVerified = isSuccess && canUseColumns
  const partitionColumn = partitionBy && 'column' in partitionBy ? partitionBy.column : undefined
  const configuredColumns = [partitionColumn, ...(clusterByField.value ?? [])].filter(
    (column, columnIndex, allConfiguredColumns): column is string =>
      typeof column === 'string' &&
      column.trim().length > 0 &&
      allConfiguredColumns.indexOf(column) === columnIndex
  )
  const unavailableColumns = configuredColumns.filter(
    (column) =>
      areColumnsVerified &&
      (!sourceColumnNameSet.has(column) ||
        (publishedColumnNames != null && !publishedColumnNames.has(column)))
  )
  const unavailableColumnSet = new Set(unavailableColumns)
  const isColumnSelectionError =
    isPublicationColumnsError || isMetadataListErrorVisible(isError, columns.length)

  const { handleOpenChange: handleRefreshColumnsOnOpen } = useRefreshOnOpen({
    isEnabled: shouldLoadColumns,
    refetch: refetchColumns,
  })
  const handleColumnPickerOpenChange = (isOpen: boolean) => {
    if (isOpen && !shouldLoadColumns) {
      setShouldLoadColumns(true)
      return
    }
    handleRefreshColumnsOnOpen(isOpen)
  }

  const fieldPath = `tableOptions.${index}`
  const partitionByError = getFieldErrorMessage(errors, `${fieldPath}.partitionBy`)
  const partitionErrors = {
    column: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.column`),
    start: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.start`),
    end: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.end`),
    interval: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.interval`),
  }
  const clusterByError = getFieldErrorMessage(errors, `${fieldPath}.clusterBy`)
  const columnSelection: ColumnSelectionState = {
    availableColumnNames,
    columnTypeByName,
    isError: isColumnSelectionError,
    isLoading: isLoadingColumns,
    onOpenChange: handleColumnPickerOpenChange,
    unavailableColumnSet,
  }

  return (
    <div className="flex flex-col gap-y-3 rounded-md border p-3 ml-6">
      <PartitioningFields
        partitionBy={partitionBy}
        onChange={partitionByField.onChange}
        onNeedsColumns={() => setShouldLoadColumns(true)}
        columnSelection={columnSelection}
        errors={partitionErrors}
      />

      <ClusteringFields
        clusterBy={clusterByField.value ?? []}
        onChange={clusterByField.onChange}
        columnSelection={columnSelection}
        error={clusterByError}
      />

      {partitionByError && <p className="text-sm text-destructive-600">{partitionByError}</p>}

      {shouldLoadColumns && isColumnSelectionError && (
        <p className="text-sm text-warning-600">
          Unable to verify columns against the source and publication. Refresh and try again.
        </p>
      )}

      {unavailableColumns.length > 0 && (
        <p className="text-sm text-destructive-600 leading-normal">
          Some columns are no longer in the source or publication. Choose different columns or
          remove them.
        </p>
      )}
    </div>
  )
}
