import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table'
import { createContext, ReactNode, RefObject, useContext, useMemo, useRef } from 'react'

import { DataTableFilterField } from '../DataTable.types'
import { RowSelectionModifiers } from '../rowSelection.utils'
import { ResponseError } from '@/types'

// REMINDER: read about how to move controlled state out of the useReactTable hook
// https://github.com/TanStack/table/discussions/4005#discussioncomment-7303569

interface DataTableStateContextType<TSearchParams = unknown> {
  columnFilters: ColumnFiltersState
  sorting: SortingState
  columnOrder: string[]
  columnVisibility: VisibilityState
  pagination: PaginationState
  enableColumnOrdering: boolean
  searchParameters: TSearchParams
}

interface DataTableBaseContextType<TData = unknown, TValue = unknown> {
  table: Table<TData>
  error: ResponseError | null
  filterFields: DataTableFilterField<TData>[]
  columns: ColumnDef<TData, TValue>[]
  isFetching: boolean
  isError: boolean
  isLoading: boolean
  isLoadingCounts: boolean
  getFacetedUniqueValues?: (table: Table<TData>, columnId: string) => Map<string, number>
  getFacetedMinMaxValues?: (table: Table<TData>, columnId: string) => undefined | [number, number]
}

interface DataTableContextType<TData = unknown, TValue = unknown, TSearchParams = unknown>
  extends DataTableStateContextType<TSearchParams>, DataTableBaseContextType<TData, TValue> {}

export const DataTableContext = createContext<DataTableContextType<any, any, any> | null>(null)

interface DataTableSelectionState {
  rowSelection: RowSelectionState
  openRowId: string | undefined
}

interface DataTableSelectionActions {
  setOpenRowId: (id: string | undefined) => void
  onSelectRow?: (id: string, modifiers?: RowSelectionModifiers) => void
  rowNavigationRef: RefObject<{
    scrollToRow: (id: string, focus: boolean) => void
  } | null>
}

const SelectionContext = createContext<DataTableSelectionState | null>(null)
const SelectionActionsContext = createContext<DataTableSelectionActions | null>(null)
const EMPTY_SELECTION: RowSelectionState = {}
const noop = () => {}

export function DataTableProvider<TData, TValue, TSearchParams = unknown>({
  children,
  rowSelection = EMPTY_SELECTION,
  openRowId,
  setOpenRowId = noop,
  onSelectRow,
  table,
  error,
  columns,
  filterFields,
  columnFilters,
  sorting,
  columnOrder,
  columnVisibility,
  pagination,
  enableColumnOrdering = false,
  searchParameters,
  isFetching,
  isError,
  isLoading,
  isLoadingCounts,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
}: Partial<DataTableStateContextType<TSearchParams>> &
  Partial<DataTableSelectionState> &
  Pick<Partial<DataTableSelectionActions>, 'setOpenRowId' | 'onSelectRow'> &
  DataTableBaseContextType<TData, TValue> & {
    children: ReactNode
  }) {
  const rowNavigationRef = useRef<DataTableSelectionActions['rowNavigationRef']['current']>(null)
  const selection = useMemo(() => ({ rowSelection, openRowId }), [rowSelection, openRowId])
  const actions = useMemo(
    () => ({ setOpenRowId, onSelectRow, rowNavigationRef }),
    [setOpenRowId, onSelectRow]
  )
  // TanStack's table object is stable even when its data or internal sizing changes.
  const { columnSizing, columnSizingInfo } = table.getState()
  const data = table.options.data
  const tableColumns = table.options.columns
  const value = useMemo(
    () => ({
      table,
      error,
      columns,
      filterFields,
      columnFilters: columnFilters ?? [],
      sorting: sorting ?? [],
      columnOrder: columnOrder ?? [],
      columnVisibility: columnVisibility ?? {},
      pagination: pagination ?? { pageIndex: 0, pageSize: 10 },
      enableColumnOrdering,
      searchParameters,
      isFetching,
      isError,
      isLoading,
      isLoadingCounts,
      getFacetedUniqueValues,
      getFacetedMinMaxValues,
      columnSizing,
      columnSizingInfo,
      data,
      tableColumns,
    }),
    [
      table,
      error,
      columns,
      filterFields,
      columnFilters,
      sorting,
      columnOrder,
      columnVisibility,
      pagination,
      enableColumnOrdering,
      searchParameters,
      isFetching,
      isError,
      isLoading,
      isLoadingCounts,
      getFacetedUniqueValues,
      getFacetedMinMaxValues,
      columnSizing,
      columnSizingInfo,
      data,
      tableColumns,
    ]
  )

  return (
    <DataTableContext.Provider value={value}>
      <SelectionActionsContext.Provider value={actions}>
        <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
      </SelectionActionsContext.Provider>
    </DataTableContext.Provider>
  )
}

export function useDataTableSelection() {
  const context = useContext(SelectionContext)
  if (!context) throw new Error('useDataTableSelection must be used within a DataTableProvider')
  return context
}

export function useDataTableSelectionActions() {
  const context = useContext(SelectionActionsContext)
  if (!context)
    throw new Error('useDataTableSelectionActions must be used within a DataTableProvider')
  return context
}

export function useDataTable<TData, TValue, TSearchParams = unknown>() {
  const context = useContext(DataTableContext)

  if (!context) {
    throw new Error('useDataTable must be used within a DataTableProvider')
  }

  return context as DataTableContextType<TData, TValue, TSearchParams>
}
