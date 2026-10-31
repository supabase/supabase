import type { PGForeignTable, PGMaterializedView, PGTable, PGView } from '@supabase/pg-meta'
import { z } from 'zod'

// The shape of the remote MCP `list_tables` output, so the model sees the same thing in every
// environment.
const columnSchema = z.object({
  name: z.string(),
  data_type: z.string(),
  format: z.string(),
  options: z.array(z.string()),
  default_value: z.string().optional(),
  identity_generation: z.string().nullable().optional(),
  enums: z.array(z.string()).optional(),
  check: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
})

const foreignKeyConstraintSchema = z.object({
  name: z.string(),
  source_table: z.string(),
  source_columns: z.array(z.string()),
  target_table: z.string(),
  target_columns: z.array(z.string()),
})

export const listTablesOutputSchema = z.object({
  tables: z.array(
    z.object({
      /** `schema.table` */
      name: z.string(),
      /** Omitted for regular tables, as in MCP. */
      type: z.enum(['view', 'materialized_view', 'foreign_table']).optional(),
      rls_enabled: z.boolean(),
      rows: z.number().nullable(),
      comment: z.string().nullable().optional(),
      columns: z.array(columnSchema).nullable().optional(),
      primary_keys: z.array(z.string()).nullable().optional(),
      foreign_key_constraints: z.array(foreignKeyConstraintSchema).optional(),
    })
  ),
})

export type ListTablesOutput = z.infer<typeof listTablesOutputSchema>

type Column = NonNullable<PGTable['columns']>[number]

function toColumn(
  column: Column
): NonNullable<ListTablesOutput['tables'][number]['columns']>[number] {
  const options = [
    column.is_identity && 'identity',
    column.is_generated && 'generated',
    column.is_nullable && 'nullable',
    column.is_updatable && 'updatable',
    column.is_unique && 'unique',
  ].filter((option) => typeof option === 'string')

  return {
    name: column.name,
    data_type: column.data_type,
    format: column.format,
    options,
    ...(column.default_value != null && { default_value: String(column.default_value) }),
    ...(column.identity_generation !== null && { identity_generation: column.identity_generation }),
    ...(column.enums.length > 0 && { enums: column.enums }),
    ...(column.check !== null && { check: column.check }),
    ...(column.comment !== null && { comment: column.comment }),
  }
}

/** pg-meta lists one relationship row per column pair; a composite key becomes one constraint. */
function toForeignKeyConstraints(relationships: PGTable['relationships']) {
  const constraints = new Map<
    number,
    NonNullable<ListTablesOutput['tables'][number]['foreign_key_constraints']>[number]
  >()
  for (const relationship of relationships) {
    const existing = constraints.get(relationship.id)
    if (existing) {
      existing.source_columns.push(relationship.source_column_name)
      existing.target_columns.push(relationship.target_column_name)
      continue
    }
    constraints.set(relationship.id, {
      name: relationship.constraint_name,
      source_table: `${relationship.source_schema}.${relationship.source_table_name}`,
      source_columns: [relationship.source_column_name],
      target_table: `${relationship.target_table_schema}.${relationship.target_table_name}`,
      target_columns: [relationship.target_column_name],
    })
  }
  return [...constraints.values()]
}

type Relations = {
  tables: readonly PGTable[]
  views: readonly PGView[]
  materializedViews: readonly PGMaterializedView[]
  foreignTables: readonly PGForeignTable[]
}

type NonTableRelation = Pick<PGView, 'schema' | 'name' | 'comment' | 'columns'>

function toNonTableEntry(
  relation: NonTableRelation,
  type: NonNullable<ListTablesOutput['tables'][number]['type']>,
  verbose: boolean
): ListTablesOutput['tables'][number] {
  const summary = {
    name: `${relation.schema}.${relation.name}`,
    type,
    // Postgres has no row security or row estimate for these relations here.
    rls_enabled: false,
    rows: null,
    ...(relation.comment !== null && { comment: relation.comment }),
  }
  if (!verbose) return summary
  return {
    ...summary,
    columns: relation.columns ? relation.columns.map(toColumn) : null,
    primary_keys: [],
  }
}

/**
 * Maps pg-meta relation rows to the MCP `list_tables` shape. Columns, primary keys and foreign
 * keys are included only when `verbose`, as in MCP. Views, materialized views and foreign tables
 * are tagged with a `type`; regular tables omit it.
 */
export function toListTablesOutput(
  { tables, views, materializedViews, foreignTables }: Relations,
  verbose: boolean
): ListTablesOutput {
  return {
    tables: [
      ...tables.map((table) => {
        const summary = {
          name: `${table.schema}.${table.name}`,
          rls_enabled: table.rls_enabled,
          rows: table.live_rows_estimate,
          ...(table.comment !== null && { comment: table.comment }),
        }
        if (!verbose) return summary

        const foreignKeyConstraints = toForeignKeyConstraints(table.relationships)
        return {
          ...summary,
          columns: table.columns ? table.columns.map(toColumn) : null,
          primary_keys: table.primary_keys.map((key) => key.name),
          ...(foreignKeyConstraints.length > 0 && {
            foreign_key_constraints: foreignKeyConstraints,
          }),
        }
      }),
      ...views.map((view) => toNonTableEntry(view, 'view', verbose)),
      ...materializedViews.map((view) => toNonTableEntry(view, 'materialized_view', verbose)),
      ...foreignTables.map((table) => toNonTableEntry(table, 'foreign_table', verbose)),
    ],
  }
}
