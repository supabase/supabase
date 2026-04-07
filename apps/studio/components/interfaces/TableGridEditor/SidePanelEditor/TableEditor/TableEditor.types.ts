import type { ColumnField } from '../SidePanelEditor.types'
import type { InferredColumnType } from '../SpreadsheetImport/SpreadsheetImport.utils'
import type { Prettify } from '@/lib/type-helpers'
import type { Dictionary } from '@/types'

export type TableField = Prettify<{
  id: number
  name: string
  comment?: string | null
  columns: Array<ColumnField>
  isRLSEnabled: boolean
  isRealtimeEnabled: boolean
}>

export interface ImportContent {
  file?: File
  headers: Array<string>
  rowCount: number
  rows: unknown[]
  columnTypeMap: Dictionary<InferredColumnType>
  selectedHeaders: Array<string>
  emptyStringAsNullHeaders?: Array<string>
  resolve: () => void
}
