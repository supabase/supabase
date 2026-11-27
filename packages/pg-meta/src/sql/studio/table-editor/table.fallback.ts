/**
 * TEMPORARY. Delete once Spark (turso) runs `getTableEditorSql`, which fails there on `DISTINCT ON`.
 *
 * Builds the table editor's entity for a table (`r`) or partitioned table (`p`) from the facts
 * `tables.fallback.ts` reads; sizes and row estimates read as 0 and enums as empty without
 * `pg_enum`. Views, materialized views and foreign tables are not described: turso's `pg_class`
 * does not list them.
 */
import type { CatalogQuery } from '../../../catalog-fallback'
import { literal, safeSql } from '../../../pg-format'
import { readRelationFacts, readTableRows } from '../../tables.fallback'

/** Fallback for `getTableEditorSql`: the same rows, `[{ entity }]`, or `[]` for no table. */
export async function getTableEditorFallback(
  query: CatalogQuery,
  { id }: { id: number }
): Promise<{ entity: Record<string, unknown> }[]> {
  const [table] = await readTableRows(query, safeSql`c.oid = ${literal(id)}`)
  if (!table) return []
  if (table.kind !== 'r' && table.kind !== 'p') {
    throw new Error(`The table editor fallback describes only tables, not relkind '${table.kind}'`)
  }
  const facts = await readRelationFacts(query, [table], { includeColumns: true })
  const ref = { schema: table.schema, table_name: table.name, table_id: table.id }

  // pg-meta joins every `conkey` column with every `confkey` column here, not by position.
  const relationships = facts.foreignKeys.flatMap((fk) =>
    fk.sourceColumns.flatMap((source_column_name) =>
      fk.targetColumns.map((target_column_name) => ({
        id: fk.id,
        constraint_name: fk.name,
        deletion_action: fk.deletionAction,
        update_action: fk.updateAction,
        source_schema: fk.sourceSchema,
        source_table_name: fk.sourceTable,
        source_column_name,
        target_table_schema: fk.targetSchema,
        target_table_name: fk.targetTable,
        target_column_name,
      }))
    )
  )

  return [
    {
      entity: {
        entity_type: table.kind,
        id: table.id,
        schema: table.schema,
        name: table.name,
        rls_enabled: table.rls_enabled,
        rls_forced: table.rls_forced,
        replica_identity: table.replica_identity,
        bytes: 0,
        size: '0 bytes',
        live_rows_estimate: 0,
        dead_rows_estimate: 0,
        comment: table.comment,
        primary_keys: (facts.primaryKeys.get(table.id) ?? []).map((name) => ({ ...ref, name })),
        unique_indexes: (facts.uniqueIndexes.get(table.id) ?? []).map((columns) => ({
          ...ref,
          columns,
        })),
        relationships,
        columns: facts.columns.get(table.id) ?? [],
      },
    },
  ]
}
