import type { WarehouseTableState } from './warehouseDemoStore'
import {
  getSourceSchemaName,
  getWarehouseSchemaName,
  isWarehouseSchema,
  parseTableKey,
} from './warehouseNaming.utils'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import type { Entity } from '@/data/entity-types/entity-types-infinite-query'

export const WAREHOUSE_TABLE_DETAIL_VIEW = 'warehouse'

export type TableDetailSection = 'overview' | 'columns' | 'policies' | 'settings' | 'storage'

export function getActiveWarehouseSchemas(
  warehouseTables: Record<string, WarehouseTableState>
): string[] {
  const schemas = new Set<string>()

  for (const [tableKey, state] of Object.entries(warehouseTables)) {
    if (state.mode !== 'has_warehouse_copy') continue
    const { schema } = parseTableKey(tableKey)
    schemas.add(getWarehouseSchemaName(schema))
  }

  return Array.from(schemas).sort()
}

export function getSourceSchemaFromWarehouseSchema(warehouseSchema: string): string {
  return getSourceSchemaName(warehouseSchema)
}

export function mapEntitiesForWarehouseSchema(
  warehouseSchema: string,
  sourceEntities: Entity[],
  warehouseTables: Record<string, WarehouseTableState>
): Entity[] {
  const sourceSchema = getSourceSchemaFromWarehouseSchema(warehouseSchema)

  return sourceEntities
    .filter((entity) => {
      if (entity.schema !== sourceSchema) return false
      const tableKey = `${sourceSchema}.${entity.name}`
      return warehouseTables[tableKey]?.mode === 'has_warehouse_copy'
    })
    .map((entity) => ({
      ...entity,
      schema: warehouseSchema,
    }))
}

export function getTableEditorViewSchema(
  selectedSchema: string | undefined,
  tableSchema: string | undefined
): string | undefined {
  if (selectedSchema && isWarehouseSchema(selectedSchema)) return selectedSchema
  return tableSchema
}

export function isTableEditorSchemaLocked(schema: string): boolean {
  return isWarehouseSchema(schema)
}

export function isWarehouseTableDetailView({
  viewFromQuery,
  tableSchema,
}: {
  viewFromQuery?: string
  tableSchema?: string
}): boolean {
  if (viewFromQuery === WAREHOUSE_TABLE_DETAIL_VIEW) return true
  if (tableSchema !== undefined && isWarehouseSchema(tableSchema)) return true
  return false
}

export function buildTableDetailUrl(
  projectRef: string,
  tableId: number,
  options?: {
    view?: typeof WAREHOUSE_TABLE_DETAIL_VIEW
    section?: TableDetailSection
  }
): string {
  const section = options?.section ?? 'overview'
  const sectionPath =
    section === 'overview' ? '' : section === 'storage' ? '/storage' : `/${section}`
  const base = `/project/${projectRef}/database/tables/${tableId}${sectionPath}`
  if (options?.view === WAREHOUSE_TABLE_DETAIL_VIEW) {
    return `${base}?view=${WAREHOUSE_TABLE_DETAIL_VIEW}`
  }
  return base
}

export function buildTableEditorUrlForTableKey({
  projectRef,
  tableId,
  tableKey,
  variant,
}: {
  projectRef: string
  tableId: number
  tableKey: string
  variant: 'source' | 'warehouse'
}) {
  const { schema } = parseTableKey(tableKey)
  const sourceSchema = getSourceSchemaName(schema)
  const editorSchema = variant === 'warehouse' ? getWarehouseSchemaName(sourceSchema) : sourceSchema

  return buildTableEditorUrl({
    projectRef,
    tableId,
    schema: editorSchema,
  })
}
