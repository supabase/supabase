import React from 'react'
import { Dictionary } from './base'
import { SupaRow, SupaTable } from './table'

export interface GridProps {
  width?: string | number
  height?: string | number
  defaultColumnWidth?: string | number
  containerClass?: string
  gridClass?: string
  rowClass?: ((row: SupaRow) => string | undefined) | undefined
}

export interface SupabaseGridProps {
  /**
   * database table swagger or table name
   */
  table: SupaTable | string
  /**
   *
   * run sql query
   */
  onSqlQuery: (query: string) => Promise<{ data?: any; error?: any }>

  /**
   * Optional react node to display in grid header
   */
  headerActions?: React.ReactNode
  editable?: boolean
  /**
   * props to config grid view
   */
  gridProps?: GridProps
  /**
   * table schema. Default set to 'public' if not provided
   */
  schema?: string
  /**
   * storageRef is used to save state on localstorage
   */
  storageRef?: string
  /**
   * Optional grid theme
   */
  theme?: 'dark' | 'light'
  /**
   * show create new column button if available
   */
  onAddColumn?: () => void
  /**
   * show add row button if available
   */
  onAddRow?: () => void
  /**
   * show delete column menu if available
   */
  onDeleteColumn?: (columnName: string) => void
  /**
   * show edit column menu if available
   */
  onEditColumn?: (columnName: string) => void
  /**
   * show edit row button if available
   */
  onEditRow?: (row: SupaRow) => void
  onError?: (error: any) => void
  onExpandJSONEditor: (column: string, row: SupaRow) => void
}

export interface SupabaseGridRef {
  /**
   * callback when a new row is added
   *
   * @param row   newly added row data
   */
  rowAdded(row: Dictionary<any>): void
  /**
   * callback when a row is edited
   *
   * @param row   edited row data
   * @param idx   edited row index
   */
  rowEdited(row: Dictionary<any>, idx: number): void
}
