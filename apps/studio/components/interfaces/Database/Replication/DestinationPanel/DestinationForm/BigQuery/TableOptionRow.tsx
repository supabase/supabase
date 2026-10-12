import { useParams } from 'common'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { get, useController, useFormState, type Control, type FieldErrors } from 'react-hook-form'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

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

type TableOption = NonNullable<DestinationPanelSchemaType['tableOptions']>[number]
type PartitionBy = TableOption['partitionBy']

const getFieldErrorMessage = (errors: FieldErrors<DestinationPanelSchemaType>, path: string) => {
  const error = get(errors, path)
  return typeof error?.message === 'string' ? error.message : undefined
}

interface TableOptionErrors {
  partitionBy?: string
  column?: string
  start?: string
  end?: string
  interval?: string
  clusterBy?: string
}

interface TableOptionEditorProps {
  partitionBy: PartitionBy
  clusterBy: string[]
  onPartitionByChange: (partitionBy: PartitionBy) => void
  onClusterByChange: (clusterBy: string[]) => void
  errors?: TableOptionErrors
  isPublicationColumnsError?: boolean
  isPublicationColumnsPending?: boolean
  publishedColumnNames?: ReadonlySet<string> | null
  tableId: number
  onClear?: () => void
}

const TableOptionEditor = ({
  partitionBy,
  clusterBy,
  onPartitionByChange,
  onClusterByChange,
  errors = {},
  isPublicationColumnsError = false,
  isPublicationColumnsPending = false,
  publishedColumnNames,
  tableId,
  onClear,
}: TableOptionEditorProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })

  const shouldInitiallyLoadColumns =
    partitionBy?.kind === 'time_column' ||
    partitionBy?.kind === 'integer_range' ||
    clusterBy.length > 0
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
  const configuredColumns = [partitionColumn, ...clusterBy].filter(
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

  const columnSelection: ColumnSelectionState = {
    availableColumnNames,
    columnTypeByName,
    isError: isColumnSelectionError,
    isLoading: isLoadingColumns,
    onOpenChange: handleColumnPickerOpenChange,
    unavailableColumnSet,
  }

  return (
    <div className="flex flex-col gap-y-4 border-t px-3 py-4">
      <PartitioningFields
        partitionBy={partitionBy}
        onChange={onPartitionByChange}
        onNeedsColumns={() => setShouldLoadColumns(true)}
        columnSelection={columnSelection}
        errors={{
          column: errors.column,
          start: errors.start,
          end: errors.end,
          interval: errors.interval,
        }}
      />

      {errors.partitionBy && <p className="text-sm text-destructive-600">{errors.partitionBy}</p>}

      <ClusteringFields
        clusterBy={clusterBy}
        onChange={onClusterByChange}
        columnSelection={columnSelection}
        error={errors.clusterBy}
      />

      {shouldLoadColumns && isColumnSelectionError && (
        <Admonition
          type="warning"
          title="Columns could not be verified"
          description="Refresh the page before changing or saving this table’s layout."
        />
      )}

      {unavailableColumns.length > 0 && (
        <Admonition
          type="destructive"
          title="Some selected columns are no longer available"
          description="Choose columns that are still in the source and publication."
        />
      )}

      {onClear !== undefined && (
        <Button
          type="button"
          variant="default"
          className="self-start"
          icon={<RotateCcw size={14} />}
          onClick={onClear}
        >
          Clear
        </Button>
      )}
    </div>
  )
}

type SharedRowProps = Pick<
  TableOptionEditorProps,
  'isPublicationColumnsError' | 'isPublicationColumnsPending' | 'publishedColumnNames' | 'tableId'
>

interface TableOptionRowProps extends SharedRowProps {
  control: Control<DestinationPanelSchemaType>
  index: number
  onClear: () => void
}

export const TableOptionRow = ({
  control,
  index,
  onClear,
  ...sharedProps
}: TableOptionRowProps) => {
  const { errors } = useFormState({ control })

  const { field: partitionByField } = useController({
    control,
    name: `tableOptions.${index}.partitionBy`,
  })
  const { field: clusterByField } = useController({
    control,
    name: `tableOptions.${index}.clusterBy`,
  })

  const fieldPath = `tableOptions.${index}`

  return (
    <TableOptionEditor
      partitionBy={partitionByField.value}
      clusterBy={clusterByField.value ?? []}
      onPartitionByChange={partitionByField.onChange}
      onClusterByChange={clusterByField.onChange}
      errors={{
        partitionBy: getFieldErrorMessage(errors, `${fieldPath}.partitionBy`),
        column: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.column`),
        start: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.start`),
        end: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.end`),
        interval: getFieldErrorMessage(errors, `${fieldPath}.partitionBy.interval`),
        clusterBy: getFieldErrorMessage(errors, `${fieldPath}.clusterBy`),
      }}
      onClear={onClear}
      {...sharedProps}
    />
  )
}

interface TableOptionDraftRowProps extends SharedRowProps {
  onCreate: (option: Pick<TableOption, 'partitionBy' | 'clusterBy'>) => void
}

/**
 * Rendered while a table has no entry in the tableOptions field array. Expanding a row must not
 * touch form state, otherwise merely looking at a table leaves the form dirty and triggers the
 * unsaved-changes prompt. The first edit creates the entry, after which TableOptionRow takes over.
 */
export const TableOptionDraftRow = ({ onCreate, ...sharedProps }: TableOptionDraftRowProps) => (
  <TableOptionEditor
    partitionBy={undefined}
    clusterBy={[]}
    onPartitionByChange={(partitionBy) => onCreate({ partitionBy, clusterBy: [] })}
    onClusterByChange={(clusterBy) => onCreate({ partitionBy: undefined, clusterBy })}
    {...sharedProps}
  />
)
