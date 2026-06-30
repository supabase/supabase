import type { WarehouseTableState } from './warehouseDemoStore'
import {
  getSourceSchemaName,
  getWarehouseSchemaName,
  isWarehouseSchema,
  parseTableKey,
} from './warehouseNaming.utils'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import type { Entity } from '@/data/entity-types/entity-types-infinite-query'

export function formatWarehouseLagLabel(lagSeconds: number): string {
  return `${lagSeconds}s lag`
}

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

export function buildTableDetailUrl(
  projectRef: string,
  tableId: number,
  schema?: string,
  section: 'overview' | 'settings' = 'settings'
): string {
  const path = section === 'settings' ? `/settings` : ''
  const base = `/project/${projectRef}/database/tables/${tableId}${path}`
  return schema !== undefined ? `${base}?schema=${encodeURIComponent(schema)}` : base
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
