import { stripIndent } from 'common-tags'

import { columnsSql, extensionsSql, tablesSql } from './sql'

export const SYSTEM_SCHEMAS = [
  'information_schema',
  'pg_catalog',
  'pg_toast',
  '_timescaledb_internal',
]

/**
 * Generates the SQL query to list tables in the database.
 */
export function listTablesSql(schemas: string[] = []) {
  let sql = stripIndent`
    with
      tables as (${tablesSql}),
      columns as (${columnsSql})
    select
      *,
      ${coalesceRowsToArray('columns', 'columns.table_id = tables.id')}
    from tables
  `

  sql += '\n'

  if (schemas.length > 0) {
    sql += `where schema in (${schemas.map((s) => `'${s}'`).join(',')})`
  } else {
    sql += `where schema not in (${SYSTEM_SCHEMAS.map((s) => `'${s}'`).join(',')})`
  }

  return sql
}

/**
 * Generates the SQL query to list all extensions in the database.
 */
export function listExtensionsSql() {
  return extensionsSql
}

/**
 * Generates a SQL segment that coalesces rows into an array of JSON objects.
 */
export const coalesceRowsToArray = (source: string, filter: string) => {
  return stripIndent`
    COALESCE(
      (
        SELECT
          array_agg(row_to_json(${source})) FILTER (WHERE ${filter})
        FROM
          ${source}
      ),
      '{}'
    ) AS ${source}
  `
}
