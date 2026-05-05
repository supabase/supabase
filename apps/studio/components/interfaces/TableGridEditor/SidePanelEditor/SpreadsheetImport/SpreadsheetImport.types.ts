import type { InferredColumnType } from './SpreadsheetImport.utils'
import type { Dictionary } from '@/types'

export interface SpreadsheetData {
  headers: string[]
  rows: unknown[]
  rowCount: number
  columnTypeMap: Dictionary<InferredColumnType>
}
