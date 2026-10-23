import {
  getUpdateIdentitySequenceSQL,
  joinSqlFragments,
  type SafeSqlFragment,
} from '@supabase/pg-meta'
import { insertQuery } from '@supabase/pg-meta/src/query'
import { chunk } from 'lodash'
import Papa from 'papaparse'
import { z } from 'zod'

import type { ImportResult } from './SpreadsheetImport.types'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { executeWithRetry } from '@/data/table-rows/table-rows-query'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import { MB } from '@/lib/constants'
import { isObject, tryParseJson } from '@/lib/helpers'
import { wrapWithRoleImpersonation, type RoleImpersonationState } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import { ResponseError } from '@/types'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 0.1 * MB

interface ImportCounts {
  insertedCount: number
  skippedCount: number
}

interface ImportOptions {
  projectRef: string
  connectionString: string | undefined | null
  table: Pick<RetrieveTableResult, 'name' | 'schema' | 'columns'>
  selectedHeaders: string[]
  emptyStringAsNullHeaders?: string[]
  skipConflictingRows?: boolean
  roleImpersonationState?: RoleImpersonationState
  onProgressUpdate: (progress: number) => void
}

const insertedCountSchema = z
  .array(
    z.object({
      inserted_count: z
        .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
        .pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)),
    })
  )
  .length(1)

function createImportSession(options: ImportOptions) {
  const { projectRef, connectionString, table, roleImpersonationState } = options
  const counts: ImportCounts = { insertedCount: 0, skippedCount: 0 }
  let failure: Extract<ImportResult, { status: 'error' }> | undefined

  const fail = (error: unknown, outcome: 'known' | 'unknown') => {
    if (!failure) failure = { ...counts, status: 'error', phase: 'insert', outcome, error }
    if (outcome === 'unknown') failure.outcome = 'unknown'
  }

  const insert = async (rows: unknown[]) => {
    if (rows.length === 0) return true
    let sql: SafeSqlFragment
    try {
      const formatted = formatRowsForInsert({
        rows,
        headers: options.selectedHeaders,
        columns: table.columns,
        emptyStringAsNullHeaders: options.emptyStringAsNullHeaders,
      })
      sql = wrapWithRoleImpersonation(
        insertQuery(table, formatted, {
          returning: 'count',
          onConflict: options.skipConflictingRows ? 'ignore' : undefined,
        }),
        roleImpersonationState
      )
      // Mirrors executeSql's size limit so an oversized batch is reported as never sent.
      if (new Blob([sql]).size > 0.98 * MB) {
        throw new Error('Import batch is too large. Split the CSV into smaller files.')
      }
    } catch (error) {
      fail(error, 'known')
      return false
    }

    try {
      const { result } = await executeWithRetry(() =>
        executeSql<unknown>({
          projectRef,
          connectionString,
          sql,
          isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
        })
      )
      const parsed = insertedCountSchema.safeParse(result)
      if (!parsed.success || parsed.data[0].inserted_count > rows.length) {
        throw new Error('The database did not return a valid inserted row count.')
      }
      const [{ inserted_count: insertedCount }] = parsed.data
      counts.insertedCount += insertedCount
      counts.skippedCount += rows.length - insertedCount
      return true
    } catch (error) {
      // A rejected request or malformed response does not prove the insert rolled back.
      const isRejectedRequest =
        error instanceof ResponseError &&
        error.code !== undefined &&
        [400, 401, 403, 413, 429].includes(error.code)
      fail(error, isRejectedRequest ? 'known' : 'unknown')
      return false
    }
  }

  const finish = async (): Promise<ImportResult> => {
    // A batch with an unknown outcome may still have committed rows
    const mayHaveInsertedRows = counts.insertedCount > 0 || failure?.outcome === 'unknown'
    if (mayHaveInsertedRows) {
      const sequenceColumns = (table.columns ?? []).filter(
        (column) =>
          column.is_identity ||
          (typeof column.default_value === 'string' && column.default_value.includes('nextval('))
      )
      if (sequenceColumns.length > 0) {
        try {
          await executeSql({
            projectRef,
            connectionString,
            sql: joinSqlFragments(
              sequenceColumns.map((column) =>
                getUpdateIdentitySequenceSQL({
                  schema: table.schema,
                  table: table.name,
                  column: column.name,
                })
              ),
              ';\n'
            ),
            queryKey: ['sequences', 'update-batch'],
          })
        } catch (error) {
          if (failure) failure.sequenceError = error
          else return { ...counts, status: 'error', phase: 'sequence', outcome: 'known', error }
        }
      }
    }
    if (failure) return { ...failure, ...counts }
    options.onProgressUpdate(100)
    return { ...counts, status: 'success' }
  }

  return { insert, finish, fail, counts }
}

export async function insertTableRows({
  rows,
  ...options
}: ImportOptions & { rows: unknown[] }): Promise<ImportResult> {
  const session = createImportSession(options)
  for (const batches of chunk(chunk(rows, BATCH_SIZE), 10)) {
    const results = await Promise.all(batches.map((batch) => session.insert(batch)))
    if (results.some((isSuccessful) => !isSuccessful)) break
    options.onProgressUpdate(
      Math.min(
        99,
        (100 * (session.counts.insertedCount + session.counts.skippedCount)) / rows.length
      )
    )
  }
  return session.finish()
}

export function insertRowsViaSpreadsheet({
  file,
  ...options
}: ImportOptions & { file: File }): Promise<ImportResult> {
  const session = createImportSession(options)
  return new Promise((resolve) => {
    let chunkNumber = 0
    let completion: Promise<ImportResult> | undefined
    const finish = () => {
      completion ??= session.finish()
      resolve(completion)
    }
    try {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        // dynamicTyping has to be disabled so that "00001" doesn't get parsed as 1.
        dynamicTyping: false,
        skipEmptyLines: true,
        chunkSize: CHUNK_SIZE,
        quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
        chunk: async (results, parser) => {
          parser.pause()
          if (!(await session.insert(results.data))) {
            parser.abort()
            return
          }
          chunkNumber += 1
          options.onProgressUpdate(Math.min(99, (100 * chunkNumber * CHUNK_SIZE) / file.size))
          parser.resume()
        },
        complete: finish,
        error: (error) => {
          session.fail(error, 'known')
          finish()
        },
      })
    } catch (error) {
      session.fail(error, 'known')
      finish()
    }
  })
}

export const formatRowsForInsert = ({
  rows,
  headers,
  columns = [],
  emptyStringAsNullHeaders = headers,
}: {
  rows: unknown[]
  headers: string[]
  columns?: RetrieveTableResult['columns']
  emptyStringAsNullHeaders?: string[]
}) => {
  return rows.map((row) => {
    const formattedRow: Record<string, unknown> = {}
    if (!isObject(row)) {
      return formattedRow
    }

    headers.forEach((header) => {
      const column = columns?.find((c) => c.name === header)

      const originalValue = row[header]

      if ((column?.format ?? '').includes('json')) {
        formattedRow[header] = tryParseJson(originalValue)
      } else if ((column?.data_type ?? '') === 'ARRAY') {
        if (
          typeof originalValue === 'string' &&
          originalValue.startsWith('{') &&
          originalValue.endsWith('}')
        ) {
          const formattedPostgresArraytoJsonArray = `[${originalValue.slice(1, originalValue.length - 1)}]`
          formattedRow[header] = tryParseJson(formattedPostgresArraytoJsonArray)
        } else {
          formattedRow[header] = tryParseJson(originalValue)
        }
      } else if (originalValue === '') {
        formattedRow[header] =
          column?.is_nullable && emptyStringAsNullHeaders.includes(header) ? null : ''
      } else {
        formattedRow[header] = originalValue
      }
    })
    return formattedRow
  })
}
