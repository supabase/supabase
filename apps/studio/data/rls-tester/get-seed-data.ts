import { ident, joinSqlFragments, literal, safeSql } from '@supabase/pg-meta'

import { RlsTableStatus } from './get-schema-ddl'
import { executeSql } from '@/data/sql/execute-sql-mutation'

export interface TableSeedData {
  schema: string
  table: string
  rows: Record<string, unknown>[]
}

// Each entry can optionally restrict which columns are fetched. Used by the
// sandbox to avoid pulling secrets (e.g. auth.users encrypted_password / tokens)
// into the browser-side PGlite instance.
export type SeedTableEntry = RlsTableStatus & { columns?: readonly string[] }

type Variables = {
  projectRef?: string
  connectionString?: string | null
  tables: SeedTableEntry[]
  rowLimit: number
}

async function fetchTableSeed(
  {
    projectRef,
    connectionString,
    schema,
    table,
    columns,
    rowLimit,
  }: Omit<Variables, 'tables'> & {
    schema: string
    table: string
    columns?: readonly string[]
  },
  signal?: AbortSignal
): Promise<TableSeedData> {
  try {
    const projection =
      columns && columns.length > 0 ? joinSqlFragments(columns.map(ident), ', ') : safeSql`*`
    const { result } = await executeSql(
      {
        projectRef,
        connectionString,
        sql: safeSql`SELECT ${projection} FROM ${ident(schema)}.${ident(table)} LIMIT ${literal(Number(rowLimit))}`,
        queryKey: ['rls-sandbox-seed', schema, table],
      },
      signal
    )
    return { schema, table, rows: (result ?? []) as Record<string, unknown>[] }
  } catch {
    return { schema, table, rows: [] }
  }
}

const SEED_CONCURRENCY = 8

export async function getProjectSeedData(
  { projectRef, connectionString, tables, rowLimit }: Variables,
  signal?: AbortSignal
): Promise<TableSeedData[]> {
  const results: TableSeedData[] = []
  const queue = tables.slice()
  const workers = Array.from({ length: Math.min(SEED_CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (!entry) break
      results.push(
        await fetchTableSeed(
          {
            projectRef,
            connectionString,
            schema: entry.schema,
            table: entry.table,
            columns: entry.columns,
            rowLimit,
          },
          signal
        )
      )
    }
  })
  await Promise.all(workers)
  return results.filter((t) => t.rows.length > 0)
}

export type ProjectSeedDataData = TableSeedData[]
