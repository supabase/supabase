const TIME_PARTITION_COLUMN_TYPES = new Set([
  'date',
  'timestamp',
  'timestamptz',
  'timestamp with time zone',
  'timestamp without time zone',
])

const INTEGER_PARTITION_COLUMN_TYPES = new Set([
  'smallint',
  'integer',
  'bigint',
  'int2',
  'int4',
  'int8',
  'serial',
  'serial2',
  'serial4',
  'serial8',
  'smallserial',
  'bigserial',
])

export const isTimePartitionColumnType = (type?: string) =>
  type !== undefined && TIME_PARTITION_COLUMN_TYPES.has(type.toLowerCase())

export const isIntegerPartitionColumnType = (type?: string) =>
  type !== undefined && INTEGER_PARTITION_COLUMN_TYPES.has(type.toLowerCase())

export const isPartitionColumnTypeCompatible = (
  kind: 'time_column' | 'integer_range',
  type?: string
) => {
  if (type === undefined) return true
  return kind === 'time_column'
    ? isTimePartitionColumnType(type)
    : isIntegerPartitionColumnType(type)
}

export type PublicationTableConfig = {
  id: number
  columns?: string[] | null
}

export type SourceTableWithPartitionParent = {
  id: number
  partition_parent_id?: number | null
}

// `undefined` means the nearest configured publication entry includes every column. `null`
// means the ancestry could not be resolved safely, so the UI must not claim any configured
// column is still valid.
export const resolvePublishedColumnNames = (
  tableId: number,
  configuredTablesById: ReadonlyMap<number, PublicationTableConfig>,
  sourceTablesById: ReadonlyMap<number, SourceTableWithPartitionParent>
): Set<string> | null | undefined => {
  const visitedTableIds = new Set<number>()
  let currentTableId: number | null | undefined = tableId

  while (currentTableId !== null && currentTableId !== undefined) {
    if (visitedTableIds.has(currentTableId)) return null
    visitedTableIds.add(currentTableId)

    const configuredTable = configuredTablesById.get(currentTableId)
    if (configuredTable) {
      return configuredTable.columns === null || configuredTable.columns === undefined
        ? undefined
        : new Set(configuredTable.columns)
    }

    const sourceTable = sourceTablesById.get(currentTableId)
    if (!sourceTable) return null
    currentTableId = sourceTable.partition_parent_id
  }

  return null
}

// React Hook Form nests field-array errors by field name. A collapsed row can only show one
// line, and any error there blocks the save, so the first message is enough to explain why.
// Only plain objects and arrays are worth walking. React Hook Form hangs a `ref` on every
// field error, which points at a DOM node whose graph is deep and cyclic.
const isTraversable = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false
  if (Array.isArray(value)) return true

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export const findFirstErrorMessage = (
  error: unknown,
  visited = new WeakSet<object>()
): string | undefined => {
  if (!isTraversable(error) || visited.has(error)) return undefined
  visited.add(error)

  const { message } = error
  if (typeof message === 'string' && message.length > 0) return message

  for (const [key, nested] of Object.entries(error)) {
    if (key === 'ref') continue

    const nestedMessage = findFirstErrorMessage(nested, visited)
    if (nestedMessage !== undefined) return nestedMessage
  }

  return undefined
}
