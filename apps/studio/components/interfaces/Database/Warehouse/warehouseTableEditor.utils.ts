import type { WarehouseTableState } from './warehouseDemoStore'
import { getWarehouseSchemaName, isWarehouseSchema, parseTableKey } from './warehouseNaming.utils'
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
  return warehouseSchema.slice(0, -'_warehouse'.length)
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
