import { CalculatedColumn, RenderHeaderCellProps } from 'react-data-grid'

export interface ExtendedCalculatedColumn extends CalculatedColumn<any, any> {
  visible?: boolean
}
export interface SavedState {
  filters?: string[]
  sorts?: string[]
  gridColumns: ExtendedCalculatedColumn[]
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
  | 'binary'
  | 'unknown'

export interface GridForeignKey {
  targetTableSchema?: string | null
  targetTableName?: string | null
  targetColumnName?: string | null
  deletionAction?: string
  updateAction?: string
}

export interface ColumnHeaderProps<R> extends RenderHeaderCellProps<R> {
  columnType: ColumnType
  isPrimaryKey: boolean | undefined
  isEncrypted: boolean | undefined
  format: string
  foreignKey?: GridForeignKey
}
