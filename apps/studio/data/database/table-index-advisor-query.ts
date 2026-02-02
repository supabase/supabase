import { useQuery } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { databaseKeys } from './keys'

import { filterProtectedSchemaIndexStatements } from 'components/interfaces/QueryPerformance/IndexAdvisor/index-advisor.utils'

export type TableIndexAdvisorVariables = {
  projectRef?: string
  connectionString?: string | null
  schema: string
  table: string
}

export type IndexAdvisorSuggestion = {
  query: string
  calls: number
  total_time: number
  mean_time: number
  index_statements: string[]
  startup_cost_before: number
  startup_cost_after: number
  total_cost_before: number
  total_cost_after: number
  improvement_percentage: number
}

export type TableIndexAdvisorResponse = {
  suggestions: IndexAdvisorSuggestion[]
  columnsWithSuggestions: string[]
}

//Generates SQL to find top 5 SELECT queries involving a table and run them through index_advisor
export function getTableIndexAdvisorSql(schema: string, table: string): string {
  const escapedSchema = schema.replace(/'/g, "''")
  const escapedTable = table.replace(/'/g, "''")

  return /* SQL */ `
-- Get top 5 SELECT queries involving this table and run through index_advisor
set search_path to public, extensions;

with top_queries as (
  select
    statements.query,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  where 
    -- Filter for SELECT queries only (index_advisor only works with SELECT)
    (lower(statements.query) like 'select%' or lower(statements.query) like 'with pgrst%')
    -- Filter for queries involving our table (handles schema.table and just table references)
    and (
      lower(statements.query) like '%${escapedSchema.toLowerCase()}.${escapedTable.toLowerCase()}%'
      or lower(statements.query) like '%from ${escapedTable.toLowerCase()}%'
      or lower(statements.query) like '%join ${escapedTable.toLowerCase()}%'
    )
    -- Exclude system queries
    and statements.query not like '%pg_catalog%'
    and statements.query not like '%information_schema%'
  order by statements.calls desc
  limit 5
)
select
  tq.query,
  tq.calls,
  tq.total_time,
  tq.mean_time,
  coalesce(ia.index_statements, '{}') as index_statements,
  coalesce((ia.startup_cost_before)::numeric, 0) as startup_cost_before,
  coalesce((ia.startup_cost_after)::numeric, 0) as startup_cost_after,
  coalesce((ia.total_cost_before)::numeric, 0) as total_cost_before,
  coalesce((ia.total_cost_after)::numeric, 0) as total_cost_after
from top_queries tq
left join lateral (
  select * from index_advisor(tq.query)
) ia on true;
`.trim()
}

//Extracts column names from index statements
//e.g. "CREATE INDEX ON public.users USING btree (email)" -> "email"
function extractColumnsFromIndexStatements(indexStatements: string[]): string[] {
  const columns = new Set<string>()

  for (const statement of indexStatements) {
    // Match patterns like "USING btree (column_name)" or "USING btree (column1, column2)"
    const match = statement.match(/USING\s+\w+\s*\(([^)]+)\)/i)
    if (match) {
      const columnPart = match[1]
      // Split by comma and clean up each column name
      columnPart.split(',').forEach((col) => {
        const cleanedCol = col.trim().replace(/^"(.+)"$/, '$1') // Remove quotes if present
        if (cleanedCol) {
          columns.add(cleanedCol)
        }
      })
    }
  }

  return Array.from(columns)
}

export async function getTableIndexAdvisorSuggestions({
  projectRef,
  connectionString,
  schema,
  table,
}: TableIndexAdvisorVariables): Promise<TableIndexAdvisorResponse> {
  if (!projectRef) throw new Error('Project ref is required')
  if (!schema) throw new Error('Schema is required')
  if (!table) throw new Error('Table is required')

  const sql = getTableIndexAdvisorSql(schema, table)

  const { result } = await executeSql<
    Array<{
      query: string
      calls: number
      total_time: number
      mean_time: number
      index_statements: string[]
      startup_cost_before: number
      startup_cost_after: number
      total_cost_before: number
      total_cost_after: number
    }>
  >({
    projectRef,
    connectionString,
    sql,
  })

  const suggestions: IndexAdvisorSuggestion[] = (result || [])
    .filter((row) => row.index_statements && row.index_statements.length > 0)
    .map((row) => {
      // Filter out protected schema index statements
      const filteredStatements = filterProtectedSchemaIndexStatements(row.index_statements)

      // Skip this suggestion if all statements were filtered out
      if (filteredStatements.length === 0) {
        return null
      }

      const improvement =
        row.total_cost_before > 0
          ? ((row.total_cost_before - row.total_cost_after) / row.total_cost_before) * 100
          : 0

      return {
        query: row.query,
        calls: row.calls,
        total_time: row.total_time,
        mean_time: row.mean_time,
        index_statements: filteredStatements,
        startup_cost_before: row.startup_cost_before,
        startup_cost_after: row.startup_cost_after,
        total_cost_before: row.total_cost_before,
        total_cost_after: row.total_cost_after,
        improvement_percentage: Math.round(improvement * 100) / 100,
      }
    })
    .filter((suggestion): suggestion is IndexAdvisorSuggestion => suggestion !== null)

  // Extract all unique columns from suggestions
  const allIndexStatements = suggestions.flatMap((s) => s.index_statements)
  const columnsWithSuggestions = extractColumnsFromIndexStatements(allIndexStatements)

  return {
    suggestions,
    columnsWithSuggestions,
  }
}

export type TableIndexAdvisorData = Awaited<ReturnType<typeof getTableIndexAdvisorSuggestions>>
export type TableIndexAdvisorError = ResponseError

export function useTableIndexAdvisorQuery<TData = TableIndexAdvisorData>(
  { projectRef, connectionString, schema, table }: TableIndexAdvisorVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableIndexAdvisorData, TableIndexAdvisorError, TData> = {}
) {
  return useQuery<TableIndexAdvisorData, TableIndexAdvisorError, TData>({
    queryKey: databaseKeys.tableIndexAdvisor(projectRef, schema, table),
    queryFn: () =>
      getTableIndexAdvisorSuggestions({
        projectRef,
        connectionString,
        schema,
        table,
      }),
    enabled: enabled && typeof projectRef !== 'undefined' && !!schema && !!table,
    retry: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
