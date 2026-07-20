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

/**
 * Inverse of {@link getWarehouseQualifiedTableName}: maps a warehouse-qualified name
 * (e.g. `public_warehouse.orders`) back to its source table key (`public.orders`).
 */
export function sourceTableKeyFromWarehouseQualifiedName(qualifiedName: string): string {
  const dotIndex = qualifiedName.indexOf('.')
  if (dotIndex === -1) return qualifiedName

  const schema = qualifiedName.slice(0, dotIndex)
  const table = qualifiedName.slice(dotIndex + 1)
  const sourceSchema = schema.endsWith('_warehouse')
    ? schema.slice(0, -'_warehouse'.length)
    : schema

  return `${sourceSchema}.${table}`
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

const QUALIFIED_NAME_PATTERN = /\b([a-z_][\w]*)\.([a-z_][\w]*)\b/gi

export type SqlWarehouseRouting = 'postgres' | 'warehouse' | 'mixed'

function isWarehouseSchema(schema: string): boolean {
  return schema.endsWith('_warehouse')
}

export function getSqlWarehouseRouting(sql: string): SqlWarehouseRouting {
  const schemas = new Set<string>()

  for (const match of sql.matchAll(QUALIFIED_NAME_PATTERN)) {
    schemas.add(match[1].toLowerCase())
  }

  let hasWarehouseSchema = false
  let hasPostgresHeapSchema = false

  for (const schema of schemas) {
    if (isWarehouseSchema(schema)) {
      hasWarehouseSchema = true
    } else {
      hasPostgresHeapSchema = true
    }
  }

  if (hasWarehouseSchema && hasPostgresHeapSchema) return 'mixed'
  if (hasWarehouseSchema) return 'warehouse'
  return 'postgres'
}

export function getWarehouseQualifiedNamesFromSql(sql: string): string[] {
  const names: string[] = []

  for (const match of sql.matchAll(QUALIFIED_NAME_PATTERN)) {
    if (isWarehouseSchema(match[1].toLowerCase())) {
      names.push(`${match[1]}.${match[2]}`)
    }
  }

  return names
}

export function sqlReferencesWarehouse(sql: string): boolean {
  return getSqlWarehouseRouting(sql) !== 'postgres'
}

export const SQL_WAREHOUSE_ROUTING_LABELS: Record<
  Exclude<SqlWarehouseRouting, 'postgres'>,
  string
> = {
  warehouse: 'Warehouse',
  mixed: 'Postgres + Warehouse',
}

export const SQL_WAREHOUSE_ROUTING_TOOLTIPS: Record<
  Exclude<SqlWarehouseRouting, 'postgres'>,
  string
> = {
  warehouse:
    'Runs on the Warehouse analytical runtime. The warehouse copy may lag behind live Postgres.',
  mixed:
    'Joins Postgres heap tables with Warehouse copies. Warehouse-side data reflects the current sync lag.',
}

export function formatSqlWarehouseLagLabel(lagSeconds: number): string {
  return `${lagSeconds}s lag`
}

export function getSqlWarehouseFooterLabel(
  routing: Exclude<SqlWarehouseRouting, 'postgres'>,
  lagSeconds: number
): string {
  const lag = formatSqlWarehouseLagLabel(lagSeconds)
  const routingLabel =
    routing === 'warehouse' ? 'Served by Warehouse' : SQL_WAREHOUSE_ROUTING_LABELS.mixed

  return `${routingLabel} · ${lag}`
}
