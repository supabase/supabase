import dayjs from 'dayjs'
import { has, includes } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import { toast } from 'sonner'

import { DOCS_URL } from 'lib/constants'
import { tryParseJson } from 'lib/helpers'
import { Button } from 'ui'
import {
  MAX_TABLE_EDITOR_IMPORT_CSV_SIZE,
  UPLOAD_FILE_EXTENSIONS,
  UPLOAD_FILE_TYPES,
} from './SpreadsheetImport.constants'

const CHUNK_SIZE = 1024 * 1024 * 0.25 // 0.25MB

export const parseSpreadsheetText: any = (text: string) => {
  const columnTypeMap: Record<any, any> = {}
  let previewRows: any[] = []
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data
        const errors = results.errors

        headers.forEach((header) => {
          const type = inferColumnType(header, results.data as any[])
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
  onProgressUpdate: (progress: number) => void
): Promise<any> => {
  let headers: string[] = []
  let chunkNumber = 0
  let rowCount = 0
  let previewRows: any[] = []

  const columnTypeMap: Record<any, any> = {}
  const errors: any[] = []

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: true,
      quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
      chunkSize: CHUNK_SIZE,
      chunk: (results) => {
        headers = results.meta.fields as string[]

        headers.forEach((header) => {
          const type = inferColumnType(header, results.data as any[])
          if (!has(columnTypeMap, header)) {
            columnTypeMap[header] = type
          } else if (columnTypeMap[header] !== type) {
            columnTypeMap[header] = 'text'
          }
        })

        rowCount += results.data.length
        previewRows = results.data.slice(0, 20)
        if (results.errors.length > 0) {
          const formattedErrors = results.errors.map((error) => {
            if (error) return { ...error, data: results.data[error.row] }
          })
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

export const inferColumnType = (column: string, rows: object[]) => {
  // General strategy is to check the first row first, before checking across all the rows
  // to ensure uniformity in data type. Thinking we do this as an optimization instead of
  // checking all the rows up front.

  // If there are no rows to infer for, default to text
  if (rows.length === 0) return 'text'

  const columnData = (rows[0] as any)[column]
  const columnDataAcrossRows = rows.map((row: object) => (row as any)[column])

  // Unable to infer any type as there's no data, default to text
  if (columnData === undefined || columnData === null) {
    return 'text'
  }

  // Infer numerical data type (defaults to either int8 or float8)
  if (Number(columnData)) {
    const columnNumberCheck = rows.map((row: object) => Number((row as any)[column]))
    if (columnNumberCheck.includes(NaN)) {
      return 'text'
    } else {
      const columnFloatCheck = columnNumberCheck.map((num: number) => num % 1)
      return columnFloatCheck.every((item) => item === 0) ? 'int8' : 'float8'
    }
  }

  // Infer boolean type
  if (includes(['true', 'false'], columnData.toString().toLowerCase())) {
    const isAllBoolean = columnDataAcrossRows.every((item: any) => {
      if (item === null || item === undefined) return true
      else return includes(['true', 'false'], item.toString().toLowerCase())
    })
    if (isAllBoolean) {
      return 'bool'
    }
  }

  // Infer json type
  if (tryParseJson(columnData)) {
    const isAllJson = columnDataAcrossRows.every((item: any) => tryParseJson(columnData))
    if (isAllJson) {
      return 'jsonb'
    }
  }

  // Infer datetime type
  if (Date.parse(columnData)) {
    const isAllTimestamptz = columnDataAcrossRows.every((item) =>
      dayjs(item, 'YYYY-MM-DD hh:mm:ss').isValid()
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
    toast.error("Couldn't import file: only CSV or TSV files are accepted")
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
