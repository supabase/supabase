import { CalculatedColumn, RenderHeaderCellProps } from 'react-data-grid'

export interface Sort {
  table: string
  column: string
  ascending?: boolean
  nullsFirst?: boolean
}

export type FilterOperator =
  | '='
  | '<>'
  | '>'
  | '<'
  | '>='
  | '<='
  | '~~'
  | '~~*'
  | '!~~'
  | '!~~*'
  | 'in'
  | 'is'

export interface Filter {
  column: string
  operator: FilterOperator
  value: any
}

export interface SavedState {
  filters: Filter[]
  sorts: Sort[]
  gridColumns: CalculatedColumn<any, any>[]
}

export interface DragItem {
  index: number
  key: string
}

export type ColumnType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'foreign_key'
  | 'json'
  | 'number'
  | 'primary_key'
  | 'text'
  | 'citext'
  | 'time'
  | 'unknown'

export interface GridForeignKey {
  targetTableSchema?: string | null
  targetTableName?: string | null
  targetColumnName?: string | null
  deletionAction?: string
}

export interface ColumnHeaderProps<R> extends RenderHeaderCellProps<R> {
  columnType: ColumnType
  isPrimaryKey: boolean | undefined
  isEncrypted: boolean | undefined
  format: string
  foreignKey?: GridForeignKey
}
