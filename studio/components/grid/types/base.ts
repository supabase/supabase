import { CalculatedColumn, HeaderRendererProps } from '@supabase/react-data-grid'

export interface Dictionary<T> {
  [Key: string]: T
}

export interface Sort {
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
  | 'time'
  | 'unknown'

export interface GridForeignKey {
  targetTableSchema?: string | null
  targetTableName?: string | null
  targetColumnName?: string | null
  deletionAction?: string
}

export interface ColumnHeaderProps<R> extends HeaderRendererProps<R> {
  columnType: ColumnType
  isPrimaryKey: boolean | undefined
  isEncrypted: boolean | undefined
  format: string
  foreignKey?: GridForeignKey
}
