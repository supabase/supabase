import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table'
import { createContext, useContext, useMemo } from 'react'

import { DataTableFilterField } from '../DataTable.types'
import { ControlsProvider } from './ControlsProvider'

// REMINDER: read about how to move controlled state out of the useReactTable hook
// https://github.com/TanStack/table/discussions/4005#discussioncomment-7303569

interface DataTableStateContextType {
  columnFilters: ColumnFiltersState
  sorting: SortingState
  rowSelection: RowSelectionState
  columnOrder: string[]
  columnVisibility: VisibilityState
  pagination: PaginationState
  enableColumnOrdering: boolean
}

interface DataTableBaseContextType<TData = unknown, TValue = unknown> {
  table: Table<TData>
  filterFields: DataTableFilterField<TData>[]
  columns: ColumnDef<TData, TValue>[]
  isLoading?: boolean
  getFacetedUniqueValues?: (table: Table<TData>, columnId: string) => Map<string, number>
  getFacetedMinMaxValues?: (table: Table<TData>, columnId: string) => undefined | [number, number]
}

interface DataTableContextType<TData = unknown, TValue = unknown>
  extends DataTableStateContextType,
    DataTableBaseContextType<TData, TValue> {}

export const DataTableContext = createContext<DataTableContextType<any, any> | null>(null)

export function DataTableProvider<TData, TValue>({
  children,
  ...props
}: Partial<DataTableStateContextType> &
  DataTableBaseContextType<TData, TValue> & {
    children: React.ReactNode
  }) {
  const value = useMemo(
    () => ({
      ...props,
      columnFilters: props.columnFilters ?? [],
      sorting: props.sorting ?? [],
      rowSelection: props.rowSelection ?? {},
      columnOrder: props.columnOrder ?? [],
      columnVisibility: props.columnVisibility ?? {},
      pagination: props.pagination ?? { pageIndex: 0, pageSize: 10 },
      enableColumnOrdering: props.enableColumnOrdering ?? false,
    }),
    [props]
  )

  return (
    <DataTableContext.Provider value={value}>
      <ControlsProvider>{children}</ControlsProvider>
    </DataTableContext.Provider>
  )
}

export function useDataTable<TData, TValue>() {
  const context = useContext(DataTableContext)

  if (!context) {
    throw new Error('useDataTable must be used within a DataTableProvider')
  }

  return context as DataTableContextType<TData, TValue>
}
