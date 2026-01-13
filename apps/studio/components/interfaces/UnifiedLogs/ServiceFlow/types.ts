import { Table } from '@tanstack/react-table'
import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'

/**
 * Service Flow Type Definitions
 */

/**
 * Props for individual service flow blocks (Network, PostgREST, Auth, etc.)
 */
export interface ServiceFlowBlockProps {
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
export interface BlockFieldConfig {
  id: string // Unique identifier for the field
  label: string // Display label for the field
  getValue: (data: any, enrichedData?: any) => string | number | null | undefined // Function to extract value
  requiresEnrichedData?: boolean // Whether field needs enriched data to display
  maxLength?: number // Maximum length for truncation
}

/**
 * Props for the BlockField component
 */
export interface BlockFieldProps {
  config: BlockFieldConfig
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
}
