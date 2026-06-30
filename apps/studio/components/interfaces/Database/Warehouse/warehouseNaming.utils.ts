/**
 * Warehouse tables are exposed in a per-source schema to avoid name clashes
 * (e.g. public.events and foo.events both map to distinct warehouse schemas).
 */
export function isWarehouseSchema(schema: string): boolean {
  return schema.endsWith('_warehouse')
}

export function getSourceSchemaName(schema: string): string {
  return isWarehouseSchema(schema) ? schema.slice(0, -'_warehouse'.length) : schema
}

export function getWarehouseSchemaName(sourceSchema: string): string {
  return `${getSourceSchemaName(sourceSchema)}_warehouse`
}

export function getSourceTableKey(schema: string, table: string): string {
  return `${getSourceSchemaName(schema)}.${table}`
}

export function getSourceTableKeyFromWarehouseSchema(schema: string, table: string): string {
  return getSourceTableKey(schema, table)
}

export function parseTableKey(tableKey: string): { schema: string; table: string } {
  const dotIndex = tableKey.indexOf('.')
  if (dotIndex === -1) {
    return { schema: 'public', table: tableKey }
  }

  return {
    schema: tableKey.slice(0, dotIndex),
    table: tableKey.slice(dotIndex + 1),
  }
}

export function getWarehouseQualifiedTableName(tableKey: string): string {
  const { schema, table } = parseTableKey(tableKey)
  return `${getWarehouseSchemaName(schema)}.${table}`
}

export function buildWarehouseSampleQuery(tableKey: string): string {
  const qualified = getWarehouseQualifiedTableName(tableKey)

  return `-- Analytical query against the Warehouse copy
SELECT count(*) AS row_count
FROM ${qualified};`
}

export function buildSqlEditorWarehouseUrl(projectRef: string, tableKey: string): string {
  return `/project/${projectRef}/sql/new?content=${encodeURIComponent(
    buildWarehouseSampleQuery(tableKey)
  )}`
}

const WAREHOUSE_SCHEMA_PATTERN = /\b\w+_warehouse\./i

export function sqlReferencesWarehouse(sql: string): boolean {
  return WAREHOUSE_SCHEMA_PATTERN.test(sql)
}
