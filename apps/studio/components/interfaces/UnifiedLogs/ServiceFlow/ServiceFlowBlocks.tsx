/**
 * ServiceFlowBlocks.tsx
 *
 * This file contains shared components, utilities, and types for rendering service flow blocks.
 * Service flow blocks are the visual components that show the different stages of a request
 * (Request Started → Network → Service → Response) with detailed information about each stage.
 */

import { Table } from '@tanstack/react-table'
import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { DataTableSheetRowAction } from 'components/ui/DataTable/DataTableSheetRowAction'
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Globe,
  Server,
  X,
} from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import { memo, useState } from 'react'
import { useParams } from 'common'
import { formatBytes } from 'lib/helpers'
import {
  Badge,
  Button,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  Skeleton,
  cn,
} from 'ui'
import { getStatusLevel } from '../UnifiedLogs.utils'

// Field configuration imports - these define what fields are shown in each service block
import {
  originFields,
  networkPrimaryFields,
  apiKeyPrimaryField,
  apiKeyAdditionalFields,
  userPrimaryField,
  userAdditionalFields,
  locationPrimaryField,
  locationAdditionalFields,
  authorizationFields,
  techDetailsFields,
  postgrestPrimaryFields,
  postgrestResponseFields,
  authPrimaryFields,
  edgeFunctionPrimaryFields,
  edgeFunctionDetailsFields,
  storagePrimaryFields,
  storageDetailsFields,
  postgresPrimaryFields,
  postgresDetailsFields,
} from './config/serviceFlowFields'

// Import individual service block components from unified system
// These are the main visual blocks that represent each stage of the request flow
import {
  RequestStartedBlock,
  MemoizedRequestStartedBlock,
} from './components/blocks/RequestStartedBlock'
import {
  NetworkBlock,
  MemoizedNetworkBlock,
  PostgRESTBlock,
  MemoizedPostgRESTBlock,
  GoTrueBlock,
  MemoizedGoTrueBlock,
  EdgeFunctionBlock,
  MemoizedEdgeFunctionBlock,
  StorageBlock,
  MemoizedStorageBlock,
  PostgresBlock,
  MemoizedPostgresBlock,
} from './components/ServiceBlocks'
import {
  ResponseCompletedBlock,
  MemoizedResponseCompletedBlock,
} from './components/blocks/ResponseCompletedBlock'

// Debug flag for console logs - set to true for debugging
const DEBUG_SERVICE_FLOW = false

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for individual service flow blocks (Network, PostgREST, Auth, etc.)
 */
interface ServiceFlowBlockProps {
  data: any // Original log data from the database
  enrichedData?: any // Enhanced data from service flow queries
  isLoading?: boolean // Whether enriched data is still loading
  error?: string // Error message if enriched data failed to load
  isLast?: boolean // Whether this is the last block in the flow
  filterFields: DataTableFilterField<any>[] // Available filter fields for clickable values
  table: Table<any> // Table instance for filtering actions
}

/**
 * Configuration for individual fields displayed in service blocks
 */
interface BlockFieldConfig {
  id: string // Unique identifier for the field
  label: string // Display label for the field
  getValue: (data: any, enrichedData?: any) => string | number | null | undefined // Function to extract value
  skeletonClassName?: string // Custom skeleton styling while loading
  requiresEnrichedData?: boolean // Whether field needs enriched data to display
}

/**
 * Props for the BlockField component
 */
interface BlockFieldProps {
  config: BlockFieldConfig
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
}

// ============================================================================
// CORE FIELD RENDERING COMPONENTS
// ============================================================================

/**
 * BlockField - Renders an individual field in a service block
 *
 * This is the core component for displaying key-value pairs in service blocks.
 * It handles:
 * - Loading states with skeletons
 * - Special formatting for status codes and API keys
 * - Clickable fields that can be used for filtering
 * - Proper styling and hover states
 */
const BlockField = ({
  config,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: BlockFieldProps) => {
  const value = config.getValue(data, enrichedData)
  const displayValue = value ?? 'N/A'
  const stringValue = String(displayValue)

  const shouldShowSkeleton = config.requiresEnrichedData && isLoading && !value

  const filterField = filterFields.find((field) => field.value === config.id)
  const isFilterable = !!filterField

  // Special handling for status field and key fields
  const isStatusField = config.id === 'status'
  const isApiKeyField = config.id === 'api_key_role'

  const fieldContent = (
    <>
      <dt className="text-[13.5px] text-foreground-light">{config.label}</dt>
      <dd className="text-right">
        {shouldShowSkeleton ? (
          <Skeleton className={cn('h-4 w-24', config.skeletonClassName)} />
        ) : isStatusField && displayValue !== 'N/A' ? (
          <DataTableColumnStatusCode
            value={displayValue}
            level={getStatusLevel(displayValue)}
            className="text-xs"
          />
        ) : isApiKeyField && displayValue !== 'N/A' ? (
          <span className="px-2 py-1 text-xs font-mono border border-border rounded bg-surface-100">
            {displayValue}
          </span>
        ) : (
          <span
            className={`text-sm font-mono ${
              isFilterable ? 'text-foreground cursor-pointer hover:underline' : 'text-foreground'
            } ${displayValue === 'N/A' ? 'text-foreground-light' : ''}`}
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

/**
 * CollapsibleSection - Renders a collapsible section with multiple fields
 *
 * Used for grouping related fields under expandable sections like:
 * - "Authorization Details"
 * - "Technical Details"
 * - "Connection & Session Details"
 */
const CollapsibleSection = ({
  title,
  fields,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
  defaultOpen = false,
}: {
  title: string
  fields: BlockFieldConfig[]
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="text"
            size="tiny"
            className="w-full justify-start py-1 px-2 h-auto text-xs font-medium text-foreground-light hover:text-foreground"
          >
            <div className="flex items-center gap-1">
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>{title}</span>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="mt-1">
            {fields.map((field) => (
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
    </div>
  )
}

// ============================================================================
// SIMPLE DISPLAY COMPONENTS
// ============================================================================

/**
 * FieldRow - Simple field display component
 *
 * Basic key-value display without filtering capabilities.
 * Used for simple static information display.
 */
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
    <dt className="text-[13.5px] text-foreground-light">{label}</dt>
    <dd className="text-right flex items-center gap-1">
      {value}
      {expandButton}
    </dd>
  </div>
)

/**
 * StyledIcon - Consistent icon styling for service block headers
 *
 * Provides uniform styling for icons in service block headers.
 */
const StyledIcon = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-surface-200 text-foreground-light">
    <Icon size={10} />
  </div>
)

/**
 * FieldWithSeeMore - Expandable field with additional details
 *
 * Shows a primary field with an expand button that reveals additional fields.
 * Used for complex fields like API keys, user info, and location data.
 */
const FieldWithSeeMore = ({
  primaryField,
  additionalFields,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
  showValueAsBadge = false,
}: {
  primaryField: BlockFieldConfig
  additionalFields: BlockFieldConfig[]
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
  showValueAsBadge?: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const value = primaryField.getValue(data, enrichedData)
  const displayValue = value ?? 'N/A'
  const stringValue = String(displayValue)

  const shouldShowSkeleton = primaryField.requiresEnrichedData && isLoading && !value

  const filterField = filterFields.find((field) => field.value === primaryField.id)
  const isFilterable = !!filterField

  const renderValue = () => {
    if (shouldShowSkeleton) {
      return <Skeleton className="h-4 w-24" />
    }

    if (showValueAsBadge && displayValue !== 'N/A') {
      return (
        <span className="px-2 py-1 text-xs font-mono border border-border rounded bg-surface-100">
          {displayValue}
        </span>
      )
    }

    return (
      <span
        className={`text-sm font-mono ${
          isFilterable ? 'text-foreground cursor-pointer hover:underline' : 'text-foreground'
        } ${displayValue === 'N/A' ? 'text-foreground-light' : ''}`}
      >
        {displayValue}
      </span>
    )
  }

  const expandButton = (
    <Button
      type="text"
      size="tiny"
      className="p-0 h-auto text-foreground-light hover:text-foreground"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
    </Button>
  )

  const fieldContent = (
    <>
      <dt className="text-[13.5px] text-foreground-light">{primaryField.label}</dt>
      <dd className="text-right flex items-center gap-1">
        {renderValue()}
        {expandButton}
      </dd>
    </>
  )

  return (
    <div className="border-t border-border">
      {isFilterable && !shouldShowSkeleton && displayValue !== 'N/A' ? (
        <DataTableSheetRowAction
          fieldValue={primaryField.id}
          filterFields={filterFields}
          value={stringValue}
          table={table}
          className="flex justify-between items-center py-1 px-2  rounded hover:bg-accent/50 cursor-pointer w-full hover:bg-surface-400"
        >
          {fieldContent}
        </DataTableSheetRowAction>
      ) : (
        <div className="flex justify-between items-center py-1 px-2">{fieldContent}</div>
      )}

      {isExpanded && (
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
      )}
    </div>
  )
}

// ============================================================================
// TIMELINE LAYOUT COMPONENT
// ============================================================================

/**
 * TimelineStep - Visual container for service flow steps
 *
 * Provides the visual timeline layout for service flow blocks.
 * Shows the step title, status, and contains the block content.
 * Includes connecting lines between steps.
 */
const TimelineStep = ({
  title,
  status,
  statusText,
  children,
  completionTime,
  isLast = false,
}: {
  title: string
  status?: number | string
  statusText?: string
  children: React.ReactNode
  completionTime?: string
  isLast?: boolean
}) => (
  <div className="bg-surface-100 rounded-lg border border-border shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between p-3 border-b border-border bg-surface-50 rounded-t-lg">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {status && (
            <DataTableColumnStatusCode
              value={status}
              level={getStatusLevel(status)}
              className="text-xs"
            />
          )}
          {statusText && <span className="text-xs text-foreground-light ml-2">{statusText}</span>}
        </div>
      </div>
      {completionTime && (
        <span className="text-xs text-foreground-light font-mono">{completionTime}</span>
      )}
    </div>

    {/* Content */}
    <div className="p-0">{children}</div>

    {/* Connecting line to next step */}
    {!isLast && (
      <div className="flex justify-center -mb-2">
        <div className="w-px h-4 bg-border"></div>
      </div>
    )}
  </div>
)

// ============================================================================
// STORAGE-SPECIFIC UTILITY FUNCTIONS
// ============================================================================

/**
 * getStorageMetadata - Get storage metadata from enriched data or fallback
 *
 * This is the only storage utility we keep since it's specific to our service flow data structure.
 * All other storage utilities (file extensions, type detection, etc.) should use the
 * existing storage explorer utilities or standard helpers.
 */
const getStorageMetadata = (data: any, enrichedData?: any): any => {
  // First try to get from enrichedData (service flow)
  const storageMetadata = enrichedData?.storage_metadata
  if (storageMetadata) {
    return storageMetadata
  }

  // Fallback to data metadata
  const dataMetadata = data?.metadata
  if (dataMetadata) {
    return dataMetadata
  }

  return {}
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export type definitions
export type { ServiceFlowBlockProps, BlockFieldConfig, BlockFieldProps }

// Export shared components and utilities
export {
  BlockField,
  CollapsibleSection,
  FieldRow,
  StyledIcon,
  FieldWithSeeMore,
  TimelineStep,
  getStorageMetadata,
}

// Export individual service block components (imported from separate files)
export {
  RequestStartedBlock,
  MemoizedRequestStartedBlock,
  NetworkBlock,
  MemoizedNetworkBlock,
  PostgRESTBlock,
  MemoizedPostgRESTBlock,
  GoTrueBlock,
  MemoizedGoTrueBlock,
  EdgeFunctionBlock,
  MemoizedEdgeFunctionBlock,
  StorageBlock,
  MemoizedStorageBlock,
  PostgresBlock,
  MemoizedPostgresBlock,
  ResponseCompletedBlock,
  MemoizedResponseCompletedBlock,
}
