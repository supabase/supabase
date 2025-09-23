import { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { useState } from 'react'

import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'
import {
  Badge,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  Skeleton,
} from 'ui'
import { BlockFieldConfig } from '../../types'
import { BlockField } from './BlockField'

// Single source of truth for field row styling
const FieldRow = ({
  label,
  value,
  expandButton,
}: {
  label: string
  value: React.ReactNode
  expandButton?: React.ReactNode
}) => (
  <div className="flex justify-between items-center py-1 px-2">
    <dt className="flex items-center gap-2 text-[13.5px] text-foreground-light">
      <span>{label}</span>
      {expandButton}
    </dt>
    <dd className="text-right">{value}</dd>
  </div>
)

interface FieldWithSeeMoreProps {
  primaryField: BlockFieldConfig
  additionalFields: BlockFieldConfig[]
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
  showValueAsBadge?: boolean
}

// Primary field with expandable additional details
const FieldWithSeeMore = ({
  primaryField,
  additionalFields,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
  showValueAsBadge = false,
}: FieldWithSeeMoreProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasAdditionalData = additionalFields.some(
    (field) => field.getValue(data, enrichedData) && field.getValue(data, enrichedData) !== 'N/A'
  )

  const primaryValue = primaryField.getValue(data, enrichedData)
  const shouldShowSkeleton = primaryField.requiresEnrichedData && isLoading && !primaryValue
  const isApiKeyField = primaryField.id === 'api_key_role'

  // Common value rendering logic
  const renderValue = () => {
    if (shouldShowSkeleton) {
      return <Skeleton className="h-4 w-24" />
    }

    if (isApiKeyField && primaryValue && primaryValue !== 'N/A') {
      return (
        <span className="border border-border rounded px-2 py-1 bg-surface-100 text-xs font-mono text-foreground">
          {primaryValue}
        </span>
      )
    }

    if (showValueAsBadge && primaryValue && primaryValue !== 'N/A') {
      return (
        <Badge variant="secondary" size="small">
          {primaryValue}
        </Badge>
      )
    }

    return (
      <span
        className={`text-sm font-mono text-foreground ${
          primaryValue === 'N/A' ? 'text-foreground-light' : ''
        }`}
      >
        {primaryValue ?? 'N/A'}
      </span>
    )
  }

  const expandButton = hasAdditionalData ? (
    <CollapsibleTrigger asChild>
      <button className="w-3 h-3 flex items-center justify-center selection:font-mono text-foreground-lighter text-xs hover:text-foreground-light bg-foreground-muted/75 rounded [&[data-state=open]>svg]:rotate-180 hover:bg-foreground-lighter">
        <X size={10} className="text-background-surface-400 rotate-45" strokeWidth={3} />
      </button>
    </CollapsibleTrigger>
  ) : undefined

  return (
    <div className="border-t border-border">
      {hasAdditionalData ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <FieldRow label={primaryField.label} value={renderValue()} expandButton={expandButton} />
          <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mt-1">
              {additionalFields.map((field) => (
                <BlockField
                  key={field.id}
                  config={field}
                  data={data}
                  enrichedData={enrichedData}
                  isLoading={isLoading}
                  filterFields={filterFields}
                  table={table}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <FieldRow label={primaryField.label} value={renderValue()} />
      )}
    </div>
  )
}

export { FieldRow, FieldWithSeeMore }
