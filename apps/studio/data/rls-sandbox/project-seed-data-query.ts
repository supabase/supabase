import { useQuery } from '@tanstack/react-query'

import type { RlsTableStatus } from '@/data/rls-sandbox/project-schema-ddl-query'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { UseCustomQueryOptions } from '@/types'

export interface TableSeedData {
  schema: string
  table: string
  rows: Record<string, unknown>[]
}

type Variables = {
  projectRef?: string
  connectionString?: string | null
  tables: RlsTableStatus[]
  rowLimit: number
}

async function fetchTableSeed(
  {
    projectRef,
    connectionString,
    schema,
    table,
    rowLimit,
  }: Omit<Variables, 'tables'> & { schema: string; table: string },
  signal?: AbortSignal
): Promise<TableSeedData> {
  try {
    const { result } = await executeSql(
      {
        projectRef,
        connectionString,
        sql: `SELECT * FROM "${schema}"."${table}" LIMIT ${rowLimit}`,
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
          { projectRef, connectionString, schema: entry.schema, table: entry.table, rowLimit },
          signal
        )
      )
    }
  })
  await Promise.all(workers)
  return results.filter((t) => t.rows.length > 0)
}

export type ProjectSeedDataData = TableSeedData[]
export type ProjectSeedDataError = Error

export const useProjectSeedDataQuery = <TData = ProjectSeedDataData>(
  { projectRef, connectionString, tables, rowLimit }: Variables,
  options: UseCustomQueryOptions<ProjectSeedDataData, ProjectSeedDataError, TData> = {}
) =>
  useQuery<ProjectSeedDataData, ProjectSeedDataError, TData>({
    queryKey: ['rls-sandbox', 'seed', projectRef, tables.map((t) => `${t.schema}.${t.table}`)],
    queryFn: ({ signal }) =>
      getProjectSeedData({ projectRef, connectionString, tables, rowLimit }, signal),
    enabled: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
