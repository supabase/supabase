import { Dictionary } from '@supabase/grid'
import { ColumnField } from '../SidePanelEditor.types'

export interface TableField {
  id: number
  name: string
  comment?: string
  columns: ColumnField[]
  isRLSEnabled: boolean
}

export interface ImportContent {
  file: File
  headers: string[]
  rowCount: number
  rows: object[]
  columnTypeMap: Dictionary<any>
}
