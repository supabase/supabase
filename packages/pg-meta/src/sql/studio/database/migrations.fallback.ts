/**
 * TEMPORARY. Delete once Spark (turso) runs `getMigrationsSql`, which fails there on its `DO` block.
 *
 * The same rows from a plain select. Spark keeps its own migration history in this table.
 */
import { toText, type CatalogQuery } from '../../../catalog-fallback'
import { safeSql } from '../../../pg-format'

const MIGRATIONS_SQL = safeSql`
select version, name, statements
from supabase_migrations.schema_migrations
order by version desc`

/** Fallback for `getMigrationsSql`. */
export async function getMigrationsFallback(query: CatalogQuery) {
  const rows = await query(MIGRATIONS_SQL)
  return rows.map((row) => ({
    version: String(row.version),
    name: toText(row.name),
    statements: Array.isArray(row.statements) ? row.statements.map(String) : null,
  }))
}
