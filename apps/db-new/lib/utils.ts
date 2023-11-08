import { parseQuery } from '@gregnr/libpg-query'
import { PostgresTable } from '@supabase/postgres-meta'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses SQL into tables compatible with the existing schema visualizer.
 *
 * TODO: consider running in WebWorker
 */
export async function parseTables(sql: string) {
  // Parse SQL using the real Postgres parser (compiled to WASM)
  // See: https://github.com/pyramation/libpg-query-node/pull/34
  // TODO: add proper types for parsedSql
  const parsedSql = await parseQuery(sql)

  // TODO: add relationships and other missing table/column info
  const pgTables: Partial<PostgresTable>[] = parsedSql.stmts
    .filter(({ stmt }: any) => 'CreateStmt' in stmt)
    .map(({ stmt }: any) => {
      const statement = stmt.CreateStmt

      const table: Partial<PostgresTable> = {
        schema: statement.relation.schemaname ?? 'public',
        name: statement.relation.relname,
        columns: statement.tableElts.map(({ ColumnDef }: any) => ({
          name: ColumnDef.colname,
          table: statement.relation.relname,
          data_type: ColumnDef.typeName.names.find(
            ({ String: { sval } }: any) => sval !== 'pg_catalog'
          )?.String.sval,
        })),
      }

      return table
    })

  // TODO: account for relationships defined using ALTER TABLE ... ADD CONSTRAINT statements

  return pgTables
}
