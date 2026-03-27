import { useMemo } from 'react'
import type { DataTableColumn, SortState } from '../types'

export function useClientSort<T extends Record<string, any>>(
  rows: T[],
  sort: SortState | null,
  columns: DataTableColumn<T>[]
): T[] {
  return useMemo(() => {
    if (!sort) return rows

    const col = columns.find((c) => c.id === sort.columnId)
    if (!col) return rows

    return [...rows].sort((a, b) => {
      const aVal = a[sort.columnId]
      const bVal = b[sort.columnId]

      // Nulls last
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        cmp = Number(aVal) - Number(bVal)
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' })
      }

      return sort.direction === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])
}
