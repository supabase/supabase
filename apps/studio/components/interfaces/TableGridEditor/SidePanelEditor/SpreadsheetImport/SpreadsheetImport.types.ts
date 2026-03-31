import type { Dictionary } from 'types'

import type { InferredColumnType } from './SpreadsheetImport.utils'

export interface SpreadsheetData {
  headers: string[]
  rows: unknown[]
  rowCount: number
  columnTypeMap: Dictionary<InferredColumnType>
}
