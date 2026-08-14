'use client'

import { type Column } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { cn, TableHeadSort } from 'ui'

interface TanStackTableHeadSortProps<TData, TValue> {
  column: Column<TData, TValue>
  children: ReactNode
  className?: string
}

/**
 * Shared TanStack adapter for the `TableHeadSort` primitive.
 * Prefer this in TanStack tables instead of wiring `TableHeadSort` manually.
 */
export const TanStackTableHeadSort = <TData, TValue>({
  column,
  children,
  className,
}: TanStackTableHeadSortProps<TData, TValue>) => {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{children}</div>
  }

  const sort = column.getIsSorted()
  const currentSort = sort ? `${column.id}:${sort}` : ''

  const handleSortChange = () => {
    if (!sort) {
      column.toggleSorting(false)
      return
    }

    if (sort === 'asc') {
      column.toggleSorting(true)
      return
    }

    column.clearSorting()
  }

  return (
    <TableHeadSort
      column={column.id}
      currentSort={currentSort}
      onSortChange={handleSortChange}
      className={className}
    >
      {children}
    </TableHeadSort>
  )
}
