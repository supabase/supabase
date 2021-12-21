import { Dictionary } from '@supabase/grid'

export interface SpreadsheetData {
  headers: string[]
  rows: any[]
  rowCount: number
  columnTypeMap: Dictionary<string>
}
