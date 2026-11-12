import type { DatabaseSizeRelation } from '@/data/database/database-size-breakdown-query'

export const sizePercentage = (size: number, total: number) =>
  `${total > 0 ? ((size / total) * 100).toFixed(1) : '0.0'}%`

export type SizeMetric = 'total' | 'table' | 'index' | 'toast'
export type SizeView = 'all' | 'tables' | 'indexes' | 'toast' | 'schemas'
export type SizeRow = {
  id: string
  name: string
  schema: string
  type: string
  size: number
  table: number
  index: number
  toast: number
}

export const relationSize = (relation: DatabaseSizeRelation, metric: SizeMetric) => {
  if (metric === 'table') return relation.table_bytes
  if (metric === 'index') return relation.index_bytes
  if (metric === 'toast') return relation.toast_bytes
  return relation.table_bytes + relation.index_bytes + relation.toast_bytes
}

export function getSizeRows(relations: DatabaseSizeRelation[], view: SizeView): SizeRow[] {
  const tables = relations.map((relation) => ({
    id: relation.id,
    name: relation.name,
    schema: relation.schema,
    type: 'Table',
    size: view === 'all' ? relation.table_bytes : relationSize(relation, 'total'),
    table: relation.table_bytes,
    index: view === 'all' ? 0 : relation.index_bytes,
    toast: view === 'all' ? 0 : relation.toast_bytes,
  }))
  if (view === 'tables') return tables
  if (view === 'schemas') {
    const schemas = new Map<string, SizeRow>()
    for (const row of tables) {
      const previous = schemas.get(row.schema)
      schemas.set(row.schema, {
        id: row.schema,
        name: row.schema,
        schema: row.schema,
        type: 'Schema',
        size: (previous?.size ?? 0) + row.size,
        table: (previous?.table ?? 0) + row.table,
        index: (previous?.index ?? 0) + row.index,
        toast: (previous?.toast ?? 0) + row.toast,
      })
    }
    return [...schemas.values()]
  }
  const indexes = relations.flatMap((relation) =>
    relation.indexes.map((index) => ({
      id: index.id,
      name: index.name,
      schema: relation.schema,
      type: 'Index',
      size: index.bytes,
      table: 0,
      index: index.bytes,
      toast: 0,
    }))
  )
  if (view === 'indexes') return indexes
  const toast = relations
    .filter((relation) => relation.toast_bytes > 0)
    .map((relation) => ({
      id: `toast-${relation.id}`,
      name: `${relation.name} (TOAST)`,
      schema: relation.schema,
      type: 'TOAST',
      size: relation.toast_bytes,
      table: 0,
      index: 0,
      toast: relation.toast_bytes,
    }))
  if (view === 'toast') return toast
  return [...tables, ...indexes, ...toast]
}

export type SizeTreemapTile = {
  id: string
  name: string
  schema: string
  kind: 'object' | 'objects' | 'schemas'
  size: number
  colorIndex: number
  members: DatabaseSizeRelation[]
}

export function getTreemapTiles(
  relations: DatabaseSizeRelation[],
  metric: SizeMetric
): SizeTreemapTile[] {
  const total = relations.reduce((sum, relation) => sum + relationSize(relation, metric), 0)
  const schemas = new Map<string, DatabaseSizeRelation[]>()
  for (const relation of relations) {
    if (relationSize(relation, metric) === 0) continue
    const members = schemas.get(relation.schema) ?? []
    members.push(relation)
    schemas.set(relation.schema, members)
  }
  const groups = [...schemas]
    .map(([schema, members]) => ({
      schema,
      members,
      size: members.reduce((sum, relation) => sum + relationSize(relation, metric), 0),
    }))
    .sort((a, b) => b.size - a.size)
  const tiles: SizeTreemapTile[] = []
  const otherSchemas: DatabaseSizeRelation[] = []
  for (const [colorIndex, group] of groups.entries()) {
    if (colorIndex >= 7 || group.size / total < 0.03) {
      otherSchemas.push(...group.members)
      continue
    }
    const otherObjects: DatabaseSizeRelation[] = []
    const sorted = [...group.members].sort(
      (a, b) => relationSize(b, metric) - relationSize(a, metric)
    )
    for (const [index, relation] of sorted.entries()) {
      const size = relationSize(relation, metric)
      if (index >= 8 || size / total < 0.02) {
        otherObjects.push(relation)
        continue
      }
      tiles.push({
        id: `object-${relation.id}`,
        name: relation.name,
        schema: relation.schema,
        kind: 'object',
        size,
        colorIndex,
        members: [relation],
      })
    }
    if (otherObjects.length > 0)
      tiles.push({
        id: `objects-${group.schema}`,
        name: 'Other objects',
        schema: group.schema,
        kind: 'objects',
        size: otherObjects.reduce((sum, relation) => sum + relationSize(relation, metric), 0),
        colorIndex,
        members: otherObjects,
      })
  }
  if (otherSchemas.length > 0)
    tiles.push({
      id: 'other-schemas',
      name: 'Other schemas',
      schema: '',
      kind: 'schemas',
      size: otherSchemas.reduce((sum, relation) => sum + relationSize(relation, metric), 0),
      colorIndex: 7,
      members: otherSchemas,
    })
  return tiles.sort((a, b) => b.size - a.size)
}

export function getTreemapLabelLines(width: number, height: number) {
  if (width < 32 || height < 40) return 0
  if (height < 56) return 1
  if (height < 72) return 2
  return 3
}
