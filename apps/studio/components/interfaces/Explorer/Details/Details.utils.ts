import type { PGPolicy, PGTableRelationship, PGTrigger } from '@supabase/pg-meta'

import { formatCellValue } from '@/components/ui/DataGridResults/DataGridResults.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

export const ENTITY_TYPE_LABELS: Record<ENTITY_TYPE, string> = {
  [ENTITY_TYPE.TABLE]: 'Table',
  [ENTITY_TYPE.PARTITIONED_TABLE]: 'Partitioned table',
  [ENTITY_TYPE.VIEW]: 'View',
  [ENTITY_TYPE.MATERIALIZED_VIEW]: 'Materialized view',
  [ENTITY_TYPE.FOREIGN_TABLE]: 'Foreign table',
}

const sentenceCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/** e.g. "Select · anon, authenticated", with "Restrictive" called out since it narrows access. */
export function formatPolicySummary({
  command,
  roles,
  action,
}: Pick<PGPolicy, 'command' | 'roles' | 'action'>) {
  const parts = [
    command === 'ALL' ? 'All commands' : sentenceCase(command.toLowerCase()),
    roles.join(', '),
  ]
  if (action === 'RESTRICTIVE') parts.push('Restrictive')
  return parts.join(' · ')
}

/** e.g. "Before insert or update · public.set_updated_at()" */
export function formatTriggerSummary({
  activation,
  events,
  function_schema,
  function_name,
}: Pick<PGTrigger, 'activation' | 'events' | 'function_schema' | 'function_name'>) {
  const timing = sentenceCase(
    `${activation.toLowerCase()} ${events.map((event) => event.toLowerCase()).join(' or ')}`
  )
  return `${timing} · ${function_schema}.${function_name}()`
}

type RelationshipRow = Pick<
  PGTableRelationship,
  | 'constraint_name'
  | 'source_schema'
  | 'source_table_name'
  | 'source_column_name'
  | 'target_table_schema'
  | 'target_table_name'
  | 'target_column_name'
>

export type TableRelationship = {
  constraintName: string
  /** The table on the other end of the foreign key. */
  table: { schema: string; name: string }
  /** This table's columns in the key. */
  columns: string[]
  /** The other table's columns in the key. */
  otherColumns: string[]
}

/**
 * Splits a table's foreign keys into the tables it references and the tables that reference
 * it. A composite key arrives as one row per column pair and is folded into one relationship;
 * a key from a table to itself is listed once, as a reference.
 */
export function getTableRelationships(
  relationships: readonly RelationshipRow[],
  { schema, name }: { schema: string; name: string }
) {
  const references = new Map<string, TableRelationship>()
  const referencedBy = new Map<string, TableRelationship>()

  for (const row of relationships) {
    const isSource = row.source_schema === schema && row.source_table_name === name
    const isTarget = row.target_table_schema === schema && row.target_table_name === name
    if (!isSource && !isTarget) continue

    const group = isSource ? references : referencedBy
    // Constraint names are unique per table, and a foreign key belongs to its source table.
    const key = `${row.source_schema}.${row.source_table_name}:${row.constraint_name}`
    const relationship = group.get(key) ?? {
      constraintName: row.constraint_name,
      table: isSource
        ? { schema: row.target_table_schema, name: row.target_table_name }
        : { schema: row.source_schema, name: row.source_table_name },
      columns: [],
      otherColumns: [],
    }
    relationship.columns.push(isSource ? row.source_column_name : row.target_column_name)
    relationship.otherColumns.push(isSource ? row.target_column_name : row.source_column_name)
    group.set(key, relationship)
  }

  return { references: [...references.values()], referencedBy: [...referencedBy.values()] }
}

/** e.g. "id = 5" or "tenant_id = a, id = 5", naming a row the way its primary key does. */
export const formatRowIdentifiers = (rowIdentifiers: Record<string, unknown>) =>
  Object.entries(rowIdentifiers)
    .map(([column, value]) => `${column} = ${formatCellValue(value)}`)
    .join(', ')
