import { Table } from '@tanstack/react-table'
import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'

export interface ServiceFlowBlockProps {
  data: any
  enrichedData?: any
  isLoading?: boolean
  error?: string
  isLast?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
}

export interface BlockFieldConfig {
  id: string
  label: string
  getValue: (data: any, enrichedData?: any) => string | number | null | undefined
  skeletonClassName?: string
  requiresEnrichedData?: boolean
}

export interface BlockFieldProps {
  config: BlockFieldConfig
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
}
