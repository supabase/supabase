import { z } from 'zod'

import type { InferredColumnType } from './SpreadsheetImport.utils'
import type { Dictionary } from '@/types'

export const spreadsheetImportSettingsSchema = z.object({ skipConflictingRows: z.boolean() })
export type SpreadsheetImportSettings = z.infer<typeof spreadsheetImportSettingsSchema>

export type ImportResult = {
  insertedCount: number
  skippedCount: number
} & (
  | { status: 'success' }
  | {
      status: 'error'
      phase: 'insert' | 'sequence'
      outcome: 'known' | 'unknown'
      error: unknown
      sequenceError?: unknown
    }
)

export interface SpreadsheetData {
  headers: string[]
  rows: unknown[]
  rowCount: number
  columnTypeMap: Dictionary<InferredColumnType>
}
