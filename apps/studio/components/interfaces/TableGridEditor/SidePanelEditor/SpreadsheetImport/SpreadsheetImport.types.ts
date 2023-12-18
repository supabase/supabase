import { Dictionary } from 'components/grid'

export interface SpreadsheetData {
  headers: string[]
  rows: any[]
  rowCount: number
  columnTypeMap: Dictionary<string>
}
