import { SpreadsheetData } from './SpreadsheetImport.types'

export const UPLOAD_FILE_TYPES = [
  'text/csv',
  'text/tab-separated-values',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export const EMPTY_SPREADSHEET_DATA: SpreadsheetData = {
  headers: [],
  rows: [],
  rowCount: 0,
  columnTypeMap: {},
}
