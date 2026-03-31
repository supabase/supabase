import dayjs from 'dayjs'
import { DOCS_URL } from 'lib/constants'
import { isObject, tryParseJson } from 'lib/helpers'
import { has } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { Button } from 'ui'

import {
  MAX_TABLE_EDITOR_IMPORT_CSV_SIZE,
  UPLOAD_FILE_EXTENSIONS,
  UPLOAD_FILE_TYPES,
} from './SpreadsheetImport.constants'
import type { SpreadsheetData } from './SpreadsheetImport.types'

const CHUNK_SIZE = 1024 * 1024 * 0.25 // 0.25MB

export function parseSpreadsheetText({
  text,
  treatEmptyAsNull = false,
}: {
  text: string
  treatEmptyAsNull?: boolean
}): Promise<{
  headers: Array<string>
  rows: Array<unknown>
  previewRows: Array<unknown>
  columnTypeMap: Record<string, InferredColumnType>
  errors: Array<Papa.ParseError & { data: unknown }>
}> {
  const columnTypeMap: Record<string, InferredColumnType> = {}
  let previewRows: unknown[] = []
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      transform: treatEmptyAsNull ? (value: string) => (value === '' ? null : value) : undefined,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data
        const errors = results.errors.map((error) => ({ ...error, data: results.data[error.row] }))

        headers.forEach((header) => {
          const type = inferColumnType(header, results.data)
          if (!has(columnTypeMap, header)) {
            columnTypeMap[header] = type
          } else if (columnTypeMap[header] !== type) {
            columnTypeMap[header] = 'text'
          }
        })

        previewRows = results.data.slice(0, 20)
        resolve({ headers, rows, previewRows, columnTypeMap, errors })
      },
    })
  })
}

/**
 * For SpreadsheetImport side panel
 * @param file File object (CSV or TSV)
 * @returns SpreadsheetData
 */
export const parseSpreadsheet = (
  file: File,
  onProgressUpdate: (progress: number) => void,
  treatEmptyAsNull = false
): Promise<
  Omit<SpreadsheetData, 'rows'> & {
    previewRows: Array<unknown>
    errors: Array<Papa.ParseError & { data: unknown }>
  }
> => {
  let headers: string[] = []
  let chunkNumber = 0
  let rowCount = 0
  let previewRows: unknown[] = []

  const columnTypeMap: Record<string, InferredColumnType> = {}
  const errors: (Papa.ParseError & { data: unknown })[] = []

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: true,
      quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
      chunkSize: CHUNK_SIZE,
      chunk: (results) => {
        headers = results.meta.fields ?? []

        // transform option is silently ignored when worker: true, so we apply
        // the empty → null conversion manually here instead
        const data = treatEmptyAsNull
          ? results.data.map((row) => {
              const rowAsObject = isObject(row) ? row : {}
              return Object.fromEntries(
                Object.entries(rowAsObject).map(([k, v]) => [k, v === '' ? null : v])
              )
            })
          : results.data

        headers.forEach((header) => {
          const type = inferColumnType(header, data)
          if (!has(columnTypeMap, header)) {
            columnTypeMap[header] = type
          } else if (columnTypeMap[header] !== type) {
            columnTypeMap[header] = 'text'
          }
        })

        if (chunkNumber === 0) {
          previewRows = data.slice(0, 20)
        }
        rowCount += data.length
        if (results.errors.length > 0) {
          const formattedErrors = results.errors
            .map((error) => {
              if (error) return { ...error, data: results.data[error.row] }
            })
            .filter((error) => error !== undefined)
          errors.push(...formattedErrors)
        }

        chunkNumber += 1
        const progress = (chunkNumber * CHUNK_SIZE) / file.size
        onProgressUpdate(progress > 1 ? 100 : Number((progress * 100).toFixed(2)))
      },
      complete: () => {
        const data = { headers, rowCount, previewRows, columnTypeMap, errors }
        resolve(data)
      },
    })
  })
}

export const revertSpreadsheet = (headers: string[], rows: any[]) => {
  return Papa.unparse(rows, { columns: headers })
}

export type InferredColumnType = 'int8' | 'float8' | 'bool' | 'jsonb' | 'timestamptz' | 'text'

export const inferColumnType = (column: string, rows: unknown[]): InferredColumnType => {
  // General strategy is to check the first row first, before checking across all the rows
  // to ensure uniformity in data type. Thinking we do this as an optimization instead of
  // checking all the rows up front.

  // If there are no rows to infer for, default to text
  if (rows.length === 0) return 'text'

  const firstRow = rows[0]
  if (!isObject(firstRow)) {
    return 'text'
  }

  const columnData = firstRow[column]
  const columnDataAcrossRows = rows.map((row) => (isObject(row) ? row[column] : undefined))

  // Unable to infer any type as there's no data, default to text
  if (columnData === undefined || columnData === null) {
    return 'text'
  }

  // Infer numerical data type (defaults to either int8 or float8)
  const columnAsNumber = Number(columnData)
  if (!Number.isNaN(columnAsNumber)) {
    const columnNumberCheck = rows.map((row) => (isObject(row) ? Number(row[column]) : NaN))
    if (columnNumberCheck.includes(NaN)) {
      return 'text'
    } else {
      const columnFloatCheck = columnNumberCheck.map((num: number) => num % 1)
      return columnFloatCheck.every((item) => item === 0) ? 'int8' : 'float8'
    }
  }

  // Infer boolean type
  const firstCellLowerCase = columnData.toString().toLowerCase()
  if (firstCellLowerCase === 'true' || firstCellLowerCase === 'false') {
    const isAllBoolean = columnDataAcrossRows.every((item) => {
      if (item === null || item === undefined) {
        return true
      }
      const cellLowerCase = item.toString().toLowerCase()
      return cellLowerCase === 'true' || cellLowerCase === 'false'
    })
    if (isAllBoolean) {
      return 'bool'
    }
  }

  // Infer json type
  if (tryParseJson(columnData)) {
    const isAllJson = columnDataAcrossRows.every((item) => tryParseJson(item))
    if (isAllJson) {
      return 'jsonb'
    }
  }

  // Infer datetime type
  if (Date.parse(String(columnData))) {
    const isAllTimestamptz = columnDataAcrossRows.every((item) =>
      dayjs(String(item), 'YYYY-MM-DD hh:mm:ss').isValid()
    )

    if (isAllTimestamptz) {
      return 'timestamptz'
    }
  }

  return 'text'
}

export const acceptedFileExtension = (file: any) => {
  const ext = file?.name.split('.').pop().toLowerCase()
  return UPLOAD_FILE_EXTENSIONS.includes(ext)
}

export function flagInvalidFileImport(file: File): boolean {
  if (!file || !UPLOAD_FILE_TYPES.includes(file.type) || !acceptedFileExtension(file)) {
    toast.error("Couldn't import file: only CSV files are accepted")
    return true
  } else if (file.size > MAX_TABLE_EDITOR_IMPORT_CSV_SIZE) {
    toast.error(
      <div className="space-y-1">
        <p>The dashboard currently only supports importing of CSVs below 100MB.</p>
        <p>For bulk data loading, we recommend doing so directly through the database.</p>
        <Button asChild type="default" icon={<ExternalLink />} className="!mt-2">
          <Link
            href={`${DOCS_URL}/guides/database/tables#bulk-data-loading`}
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </Link>
        </Button>
      </div>,
      { duration: Infinity }
    )
    return true
  }

  return false
}
