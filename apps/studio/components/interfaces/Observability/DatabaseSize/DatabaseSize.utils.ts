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

export function getTreemapGroups(relations: DatabaseSizeRelation[], metric: SizeMetric) {
  const groups = new Map<
    string,
    { name: string; size: number; children: { name: string; size: number; isOther: boolean }[] }
  >()
  for (const relation of relations) {
    const size = relationSize(relation, metric)
    if (size === 0) continue
    const group = groups.get(relation.schema) ?? { name: relation.schema, size: 0, children: [] }
    group.size += size
    group.children.push({ name: relation.name, size, isOther: false })
    groups.set(relation.schema, group)
  }
  return [...groups.values()]
    .sort((a, b) => b.size - a.size)
    .map((group) => {
      const sorted = group.children.sort((a, b) => b.size - a.size)
      const visible = sorted.filter((item, index) => index < 8 && item.size / group.size >= 0.03)
      const other = group.size - visible.reduce((total, item) => total + item.size, 0)
      return {
        ...group,
        children: [
          ...visible,
          ...(other > 0 ? [{ name: 'Other', size: other, isOther: true }] : []),
        ],
      }
    })
}

export function partitionTreemap<T extends { size: number }>(
  items: T[],
  x = 0,
  y = 0,
  width = 100,
  height = 100
): (T & { x: number; y: number; width: number; height: number })[] {
  if (items.length === 0) return []
  if (items.length === 1) return [{ ...items[0], x, y, width, height }]
  const total = items.reduce((sum, item) => sum + item.size, 0)
  if (total <= 0) return []
  let split = 1
  let firstSize = items[0].size
  while (split < items.length - 1 && firstSize < total / 2) {
    firstSize += items[split].size
    split++
  }
  const fraction = firstSize / total
  if (width >= height)
    return [
      ...partitionTreemap(items.slice(0, split), x, y, width * fraction, height),
      ...partitionTreemap(
        items.slice(split),
        x + width * fraction,
        y,
        width * (1 - fraction),
        height
      ),
    ]
  return [
    ...partitionTreemap(items.slice(0, split), x, y, width, height * fraction),
    ...partitionTreemap(
      items.slice(split),
      x,
      y + height * fraction,
      width,
      height * (1 - fraction)
    ),
  ]
}

export function getTreemapLabelLines(width: number, height: number) {
  if (width < 72 || height < 40) return 0
  if (height < 56) return 1
  if (height < 72) return 2
  return 3
}
