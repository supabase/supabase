import type { Dictionary } from 'types'

export interface SpreadsheetData {
  headers: string[]
  rows: any[]
  rowCount: number
  columnTypeMap: Dictionary<string>
}
