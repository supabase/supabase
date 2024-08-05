import type { SpreadsheetData } from './SpreadsheetImport.types'

export const UPLOAD_FILE_TYPES = [
  'text/csv',
  'text/tab-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export const UPLOAD_FILE_EXTENSIONS = ['csv', 'tsv']

export const EMPTY_SPREADSHEET_DATA: SpreadsheetData = {
  headers: [],
  rows: [],
  rowCount: 0,
  columnTypeMap: {},
}
