import { ForeignRowSelectorProps } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector'
import React, { ReactNode } from 'react'
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
  table: SupaTable
  /**
   * database table id
   */
  tableId?: string

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
   * projectRef is used to save state on localstorage
   */
  projectRef?: string
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
  onExpandTextEditor: (column: string, row: SupaRow) => void
  updateTableRow: (previousRow: any, updatedData: any) => void
  onEditForeignKeyColumnValue: (args: {
    foreignKey: NonNullable<ForeignRowSelectorProps['foreignKey']>
    row: any
    column: any
  }) => void

  /**
   * Show custom component passed as children instead of the grid editor
   */
  showCustomChildren?: boolean

  /**
   * Custom header left most actions component
   */
  customHeader?: ReactNode

  /**
   * Custom component passed as children
   */
  children?: ReactNode

  /**
   * show import csv data button if available
   */
  onImportData?: () => void
}
