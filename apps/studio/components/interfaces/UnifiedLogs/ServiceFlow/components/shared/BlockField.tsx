import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { DataTableSheetRowAction } from 'components/ui/DataTable/DataTableSheetRowAction'
import { Skeleton } from 'ui'
import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { BlockFieldProps } from '../../types'
import { TruncatedTextWithPopover } from './TruncatedTextWithPopover'

const BlockField = ({
  config,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: BlockFieldProps) => {
  const value = config.getValue(data, enrichedData)
  const displayValue = value ?? 'No value'
  const stringValue = String(displayValue)

  const shouldShowSkeleton = config.requiresEnrichedData && isLoading && !value

  const filterField = filterFields.find((field) => field.value === config.id)
  const isFilterable = !!filterField

  // Special handling for status field and key fields
  const isStatusField = config.id === 'status'
  const isApiKeyField = config.id === 'api_key_role'

  // Truncation config
  const maxLength = config.maxLength || 50 // Default to 50 characters

  const fieldContent = (
    <>
      <dt className="text-[13.5px] text-foreground-light">{config.label}</dt>
      <dd className="text-right">
        {shouldShowSkeleton ? (
          <Skeleton className="h-4 w-24" />
        ) : isStatusField && displayValue !== 'N/A' ? (
          <DataTableColumnStatusCode
            value={displayValue}
            level={getStatusLevel(displayValue)}
            className="text-xs"
          />
        ) : isApiKeyField && displayValue !== 'N/A' ? (
          <TruncatedTextWithPopover
            text={stringValue}
            maxLength={maxLength}
            className="px-2 py-1 text-xs font-mono border border-border rounded bg-surface-100"
          />
        ) : displayValue !== 'N/A' ? (
          <TruncatedTextWithPopover
            text={stringValue}
            maxLength={maxLength}
            className={`text-sm font-mono ${
              isFilterable ? 'text-foreground cursor-pointer hover:underline' : 'text-foreground'
            }`}
          />
        ) : (
          <span
            className={`text-sm font-mono ${
              isFilterable ? 'text-foreground cursor-pointer hover:underline' : 'text-foreground'
            } text-foreground-light`}
          >
            {displayValue}
          </span>
        )}
      </dd>
    </>
  )

  if (isFilterable && !shouldShowSkeleton && displayValue !== 'N/A') {
    return (
      <DataTableSheetRowAction
        fieldValue={config.id}
        filterFields={filterFields}
        value={stringValue}
        table={table}
        className="flex justify-between items-center py-1 px-2  rounded hover:bg-accent/50 cursor-pointer w-full hover:bg-surface-400"
      >
        {fieldContent}
      </DataTableSheetRowAction>
    )
  }

  return <div className="flex justify-between items-center py-1 px-2">{fieldContent}</div>
}

export { BlockField }
