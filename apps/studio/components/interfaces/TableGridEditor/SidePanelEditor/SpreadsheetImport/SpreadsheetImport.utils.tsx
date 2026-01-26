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
      quoteChar: isTsvFile(file) ? '' : '"',
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

export const isTsvFile = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return (file.type.length === 0 || file.type === 'text/tab-separated-values') && ext === 'tsv'
}

export const acceptedFileExtension = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext !== undefined && UPLOAD_FILE_EXTENSIONS.includes(ext)
}

/**
 * Checks file mime type. Returns `true` if the mime type is among the accepted file types
 * or is an empty string.
 *
 * The reason for that is that browsers derive the uploaded mime type from the local machine's
 * registry, and sets it to `''` if the machine doesn't have a spot for the type in the machine.
 *
 * @param {File} file the file to check the mime type of
 * @returns {boolean} indicates the validity of the mime type, or `true` if it's an empty string
 */
export const acceptedFileType = (file: File): boolean => {
  return file.type.length === 0 || UPLOAD_FILE_TYPES.includes(file.type)
}

export const isFileEmpty = (file: File): boolean => {
  return file.size === 0
}

export function flagInvalidFileImport(file: File): boolean {
  if (!file || !acceptedFileType(file) || !acceptedFileExtension(file)) {
    toast.error("Couldn't import file: only CSV and TSV files are accepted")
    return true
  } else if (isFileEmpty(file)) {
    toast.error("Couldn't import file because it is empty")
    return true
  } else if (file.size > MAX_TABLE_EDITOR_IMPORT_CSV_SIZE) {
    toast.error(
      <div className="space-y-1">
        <p>The dashboard currently only supports importing of files below 100MB.</p>
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
