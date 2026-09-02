import type { components } from 'api-types'

import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']
export type WarehouseSetupTarget = WarehouseSetupBody['targets'][number]

/** Selection map keyed by `${schema}.${table}`. */
export type SchemaTableSelection = Record<string, boolean>

export type SchemaWithTables = { schema: string; tables: string[] }

export function getSchemaTableKey(schema: string, table: string): string {
  return `${schema}.${table}`
}

/**
 * Internal schemas that still hold product data users legitimately want in their warehouse.
 * Everything else in `INTERNAL_SCHEMAS` is Supabase infrastructure — `vault` (secrets),
 * `pgsodium`, `cron`/`pgmq` bookkeeping, migration history — which should never be offered as a
 * replication target.
 */
const REPLICABLE_INTERNAL_SCHEMAS = ['auth', 'storage']

const NON_SELECTABLE_SCHEMAS = new Set(
  INTERNAL_SCHEMAS.filter((schema) => !REPLICABLE_INTERNAL_SCHEMAS.includes(schema))
)

/** Postgres schemas Warehouse setup shouldn't offer for replication. */
export function isSelectableWarehouseSchema(schemaName: string): boolean {
  return !schemaName.startsWith('pg_') && !NON_SELECTABLE_SCHEMAS.has(schemaName)
}

export function getSelectedTableCount(selection: SchemaTableSelection): number {
  return Object.values(selection).filter(Boolean).length
}

/**
 * Seeds the picker's selection from the tables already in the `supabase_warehouse` publication, so
 * editing an existing setup starts from what's actually replicated instead of an empty selection.
 * Schema-level checkboxes derive from these per-table entries, so a schema whose every table is in
 * the publication ends up fully checked on its own.
 */
export function buildSelectionFromPublicationTables(
  publicationTables: { schema: string; name: string }[]
): SchemaTableSelection {
  return publicationTables.reduce<SchemaTableSelection>((selection, table) => {
    selection[getSchemaTableKey(table.schema, table.name)] = true
    return selection
  }, {})
}

/**
 * Tri-state value for a schema's checkbox. Kept here (rather than inlined as nested ternaries in
 * the picker) so the three cases stay explicit and testable.
 */
export function getSchemaCheckedState({
  selectedCount,
  totalCount,
}: {
  selectedCount: number
  totalCount: number
}): boolean | 'indeterminate' {
  if (totalCount > 0 && selectedCount === totalCount) return true
  if (selectedCount > 0) return 'indeterminate'
  return false
}

/**
 * Maps the schema/table checkbox selection down to the API's `targets` shape. A schema whose
 * every currently-known table is selected is sent as a single `{ type: 'schema' }` target
 * (matching the API's semantics of "the currently eligible tables in that schema"); otherwise each
 * selected table is sent individually. Schemas with no tables, or no selected tables, are omitted.
 */
export function buildWarehouseSetupTargets(
  selection: SchemaTableSelection,
  schemasWithTables: SchemaWithTables[]
): WarehouseSetupTarget[] {
  const targets: WarehouseSetupTarget[] = []

  for (const { schema, tables } of schemasWithTables) {
    if (tables.length === 0) continue

    const selectedTables = tables.filter((table) => selection[getSchemaTableKey(schema, table)])
    if (selectedTables.length === 0) continue

    if (selectedTables.length === tables.length) {
      targets.push({ type: 'schema', schema })
    } else {
      selectedTables.forEach((name) => {
        targets.push({ type: 'table', schema, name })
      })
    }
  }

  return targets
}

// ============================================================================
// Catalog credential secrecy + display
// ============================================================================

export type WarehouseCatalogCredentials = NonNullable<
  components['schemas']['WarehouseCatalogResponse']['credentials']
>

export const MASKED_SECRET_PLACEHOLDER = '••••••••'

/**
 * Catalog credential fields that should never be shown in plaintext by default:
 * `catalog_url` embeds the DuckLake catalog's Postgres password, and `s3_secret_access_key`
 * is a raw secret key.
 */
const SECRET_CATALOG_FIELDS: (keyof WarehouseCatalogCredentials)[] = [
  'catalog_url',
  's3_secret_access_key',
]

export function isSecretWarehouseCatalogField(field: keyof WarehouseCatalogCredentials): boolean {
  return SECRET_CATALOG_FIELDS.includes(field)
}

export function maskSecretValue(value: string | undefined | null): string {
  if (!value) return ''
  return MASKED_SECRET_PLACEHOLDER
}
