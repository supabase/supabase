import type { components } from 'api-types'

import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import { WAREHOUSE_METADATA_SCHEMA } from '@/lib/warehouse'

export type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']
export type WarehouseSetupTarget = WarehouseSetupBody['targets'][number]
export type WarehouseSetupStatus =
  components['schemas']['WarehouseSetupStatusResponse']['setup_status']
export type WarehouseSetupTable =
  components['schemas']['WarehouseSetupStatusResponse']['tables'][number]

export function isWarehouseProvisioned(setupStatus?: WarehouseSetupStatus): boolean {
  return setupStatus === 'complete'
}

export function isWarehouseSettingUp(setupStatus?: WarehouseSetupStatus): boolean {
  return setupStatus === 'setting_up' || setupStatus === 'copying'
}

/** Selection map keyed by `${schema}.${table}`. */
export type SchemaTableSelection = Record<string, boolean>

export type SchemaWithTables = { schema: string; tables: string[] }

export function getSchemaTableKey(schema: string, table: string): string {
  return `${schema}.${table}`
}

/**
 * Internal schemas that hold product data can be useful in analytics. Keep `auth` and `storage`
 * available while their platform support is being finalised, and exclude the remaining Supabase
 * infrastructure schemas.
 */
const REPLICABLE_INTERNAL_SCHEMAS = ['auth', 'storage']

const NON_SELECTABLE_SCHEMAS = new Set(
  INTERNAL_SCHEMAS.filter((schema) => !REPLICABLE_INTERNAL_SCHEMAS.includes(schema))
)

/**
 * Postgres schemas Warehouse setup shouldn't offer for replication.
 *
 * `WAREHOUSE_METADATA_SCHEMA` is excluded on top of the infrastructure schemas above: it holds the
 * DuckLake catalog describing the Warehouse itself, so replicating it would feed every Warehouse
 * write back in as more catalog rows to replicate. The platform rejects it server-side too. This
 * just keeps it out of the picker so the user never picks a target that can only fail.
 */
export function isSelectableWarehouseSchema(schemaName: string): boolean {
  return (
    !schemaName.startsWith('pg_') &&
    !NON_SELECTABLE_SCHEMAS.has(schemaName) &&
    schemaName !== WAREHOUSE_METADATA_SCHEMA
  )
}

export function getSelectedTableCount(selection: SchemaTableSelection): number {
  return Object.values(selection).filter(Boolean).length
}

export function getInitialSelectionMode({
  isEditing,
  selectedTableCount,
  totalTableCount,
}: {
  isEditing: boolean
  selectedTableCount: number
  totalTableCount: number
}): 'all' | 'selected' {
  const areAllTablesSelected = selectedTableCount === totalTableCount && totalTableCount > 0
  return isEditing && areAllTablesSelected ? 'all' : 'selected'
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
 *
 * The API replaces the previous selection with whatever is sent, so an empty result is meaningful:
 * it tears Warehouse down rather than being a no-op.
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

/**
 * Retrying a failed setup reuses whatever the platform already recorded rather than the picker's
 * selection, which is gone by the time the error surfaces.
 */
export function buildRetryTargets(
  tables: Pick<WarehouseSetupTable, 'schema' | 'name'>[] = []
): WarehouseSetupTarget[] {
  return tables.map((table) => ({ type: 'table', schema: table.schema, name: table.name }))
}

export type WarehouseCatalogCredentials = NonNullable<
  components['schemas']['WarehouseCatalogResponse']['credentials']
>

/**
 * Warehouse provisions a replication pipeline, and projects are capped on how many they may have.
 * The cap is a feature-flagged value inside the replication API and is not exposed to Studio, so
 * this recognises the failure after the fact rather than predicting it. Deliberately no
 * client-side limit constant: guessing one would block the wrong people the moment the cap changes
 * or Warehouse stops consuming a slot.
 */
export function isPipelineLimitError(message?: string): boolean {
  if (!message) return false
  return /maximum of \d+ pipelines/i.test(message)
}
