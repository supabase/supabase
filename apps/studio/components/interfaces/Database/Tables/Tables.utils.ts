import { PGForeignTable, PGMaterializedView, PGView } from '@supabase/pg-meta'

import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { SafePostgresTable } from '@/lib/postgres-types'

// [Joshen] We just need name, schema, description, rows, size, and the number of columns
// Just missing partitioned tables as missing pg-meta support
export const formatAllEntities = ({
  tables = [],
  views = [],
  materializedViews = [],
  foreignTables = [],
}: {
  tables?: SafePostgresTable[]
  views?: PGView[]
  materializedViews?: PGMaterializedView[]
  foreignTables?: PGForeignTable[]
}) => {
  const formattedTables = tables.map((x) => {
    return {
      ...x,
      type: ENTITY_TYPE.TABLE as const,
      rows: x.live_rows_estimate,
      columns: x.columns ?? [],
    }
  })

  const formattedViews = views.map((x) => {
    return {
      type: ENTITY_TYPE.VIEW as const,
      id: x.id,
      name: x.name,
      comment: x.comment,
      schema: x.schema,
      rows: undefined,
      size: undefined,
      bytes: undefined,
      columns: x.columns ?? [],
    }
  })

  const formattedMaterializedViews = materializedViews.map((x) => {
    return {
      type: ENTITY_TYPE.MATERIALIZED_VIEW as const,
      id: x.id,
      name: x.name,
      comment: x.comment,
      schema: x.schema,
      rows: undefined,
      size: undefined,
      bytes: undefined,
      columns: x.columns ?? [],
    }
  })

  const formattedForeignTables = foreignTables.map((x) => {
    return {
      type: ENTITY_TYPE.FOREIGN_TABLE as const,
      id: x.id,
      name: x.name,
      comment: x.comment,
      schema: x.schema,
      rows: undefined,
      size: undefined,
      bytes: undefined,
      columns: x.columns ?? [],
    }
  })

  return [
    ...formattedTables,
    ...formattedViews,
    ...formattedMaterializedViews,
    ...formattedForeignTables,
  ]
}

export type FormattedEntity = ReturnType<typeof formatAllEntities>[number]

export const TABLE_LIST_SORT_COLUMNS = [
  'name',
  'columns',
  'rows',
  'size',
  'realtime',
] as const

export type TableListSortColumn = (typeof TABLE_LIST_SORT_COLUMNS)[number]
export type TableListSortDirection = 'asc' | 'desc'
export type TableListSort = `${TableListSortColumn}:${TableListSortDirection}`

export const DEFAULT_TABLE_LIST_SORT: TableListSort = 'name:asc'

export const isTableListSort = (value: string): value is TableListSort => {
  const [column, direction] = value.split(':')
  return (
    TABLE_LIST_SORT_COLUMNS.includes(column as TableListSortColumn) &&
    (direction === 'asc' || direction === 'desc')
  )
}

export const handleTableListSortChange = (
  currentSort: TableListSort,
  column: string,
  setSort: (s: TableListSort) => void
) => {
  const [currentCol, currentOrder] = currentSort.split(':')
  if (currentCol === column) {
    setSort(`${column}:${currentOrder === 'asc' ? 'desc' : 'asc'}` as TableListSort)
  } else {
    // First click defaults to descending for numeric columns so the largest values
    // surface first, otherwise ascending alphabetical/boolean order is more useful.
    const defaultOrder: TableListSortDirection =
      column === 'name' || column === 'realtime' ? 'asc' : 'desc'
    setSort(`${column}:${defaultOrder}` as TableListSort)
  }
}

/**
 * Stable sort that places nullish values last regardless of direction so empty
 * rows/size cells (views, foreign tables) never crowd out tables the user is
 * actually trying to compare.
 */
export const sortEntities = (
  entities: FormattedEntity[],
  sort: TableListSort,
  realtimeEnabledIds: Set<number>
): FormattedEntity[] => {
  const [column, direction] = sort.split(':') as [TableListSortColumn, TableListSortDirection]
  const multiplier = direction === 'asc' ? 1 : -1

  const getValue = (entity: FormattedEntity): string | number | undefined => {
    switch (column) {
      case 'name':
        return entity.name.toLowerCase()
      case 'columns':
        return entity.columns.length
      case 'rows':
        return entity.rows
      case 'size':
        return entity.bytes
      case 'realtime':
        return realtimeEnabledIds.has(entity.id) ? 1 : 0
    }
  }

  return [...entities].sort((a, b) => {
    const aValue = getValue(a)
    const bValue = getValue(b)

    if (aValue === undefined && bValue === undefined) return a.name.localeCompare(b.name)
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const cmp = aValue.localeCompare(bValue)
      return cmp === 0 ? a.name.localeCompare(b.name) : cmp * multiplier
    }

    if (aValue === bValue) return a.name.localeCompare(b.name)
    return (aValue < bValue ? -1 : 1) * multiplier
  })
}
