/**
 * Warehouse tables are exposed in a per-source schema to avoid name clashes
 * (e.g. public.events and foo.events both map to distinct warehouse schemas).
 */
export function getWarehouseSchemaName(sourceSchema: string): string {
  return `${sourceSchema}_warehouse`
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
