import { useMemo } from 'react'
import type { Table, RowData } from '@tanstack/react-table'
import type { Filter, Sort } from '@supabase/pg-meta/src/query' // Assuming Filter = { column: string, operator: string, value: string }
import { Filter as FilterIcon } from 'lucide-react' // Example icon import
import type { ColumnDataType, FilterModel } from 'lib/filters'

// --- Helper Functions (can be moved to utils if needed) ---

function mapSupabaseTypeToFilterType(dataType: string): ColumnDataType {
  const normalizedType = dataType.toLowerCase().split('(')[0]
  if (
    [
      'text',
      'varchar',
      'character varying',
      'uuid',
      'json',
      'jsonb',
      'enum',
      'name',
      'citext',
      'bpchar',
    ].includes(normalizedType)
  )
    return 'text'
  if (
    [
      'int2',
      'int4',
      'int8',
      'float4',
      'float8',
      'numeric',
      'decimal',
      'real',
      'double precision',
      'smallint',
      'integer',
      'bigint',
      'serial',
      'bigserial',
      'money',
    ].includes(normalizedType)
  )
    return 'number'
  if (
    [
      'date',
      'timestamp',
      'timestamptz',
      'timestamp without time zone',
      'timestamp with time zone',
      'time',
      'timetz',
      'time without time zone',
      'time with time zone',
      'interval',
    ].includes(normalizedType)
  )
    return 'date'
  if (['bool', 'boolean'].includes(normalizedType)) return 'option'
  return 'text'
}

/**
 * Maps UI filter operators to PostgreSQL operators
 * This is needed because the UI uses friendly operator names
 * while PostgreSQL uses specific syntax operators
 */
export function mapUIFilterOperatorToPostgres(operator: string): string {
  switch (operator) {
    case 'contains':
      return '~~*' // ILIKE for case-insensitive search
    case 'does not contain':
      return '!~~*' // NOT ILIKE for case-insensitive search
    // Add more mappings as needed
    default:
      return operator // Return as is for direct operators like =, <>, etc.
  }
}

function mapSupabaseTypeToIcon(dataType: string): React.ElementType {
  const filterType = mapSupabaseTypeToFilterType(dataType)
  switch (filterType) {
    // TODO: Replace FilterIcon with actual specific icons
    case 'text':
      return FilterIcon
    case 'number':
      return FilterIcon
    case 'date':
      return FilterIcon
    case 'option':
      return FilterIcon
    case 'multiOption':
      return FilterIcon
    default:
      return FilterIcon
  }
}

// TODO: Implement proper serialization for filter values (arrays, ranges etc.) into a string
function serializeFilterValues(values: any[]): string {
  // Placeholder: Simple comma join. Might need JSON.stringify or custom logic
  if (values === null || values === undefined) return ''
  return values.join(',')
}

// TODO: Implement proper parsing of the filter value string back into { operator, values }
// This is the inverse of serializeFilterValues and needs to handle different types.
function parseFilterState(
  filter: Filter | undefined
): { operator: string; values: any[] } | undefined {
  if (!filter) return undefined
  // Placeholder: Assumes value is comma-separated. Needs proper parsing based on type/operator.
  const values = filter.value ? filter.value.split(',') : []
  return { operator: filter.operator, values: values }
}

// --- Custom Hook: useTableAdapter ---

interface UseTableAdapterArgs<TData extends RowData> {
  snap: any // Valtio snapshot (useTableEditorTableStateSnapshot) - contains schema
  filters: Filter[] // From useTableFilter: { column: string, operator: string, value: string }[]
  onApplyFilters: (filters: Filter[]) => void // From useTableFilter
  tableData: TData[] | undefined // Rows from useTableRowsQuery (data.rows)
  sorts: Sort[] // From useTableSort
}

export function useTableAdapter<TData extends RowData>({
  snap,
  filters,
  onApplyFilters,
  tableData,
  sorts,
}: UseTableAdapterArgs<TData>): Table<TData> {
  return useMemo(() => {
    // Assume snap.table.columns exists: { name: string, format: string, comment: string | null }[]
    const columnsFromSnap = snap.table?.columns ?? []
    const rowsFromQuery = tableData ?? []

    const tanstackColumns = columnsFromSnap.map((col: any) => {
      const filterType = mapSupabaseTypeToFilterType(col.format || col.dataType || '')

      // Determine a default filter function based on type
      let filterFn: string
      switch (filterType) {
        case 'text':
          filterFn = 'contains'
          break
        case 'number':
          filterFn = 'equals'
          break
        case 'date':
          filterFn = 'equals'
          break
        case 'option':
          filterFn = 'equals'
          break
        case 'multiOption':
          filterFn = 'arrIncludesSome'
          break // Example for multi-select
        default:
          filterFn = 'contains' // Use a valid default like 'contains' instead of 'auto'
      }

      return {
        id: col.name,
        accessorFn: (row: TData) => row[col.name as keyof TData],
        columnDef: {
          filterFn: filterFn, // Add the determined filterFn
          meta: {
            displayName: col.comment ?? col.name,
            type: filterType,
            icon: mapSupabaseTypeToIcon(col.format || col.dataType || ''),
          },
        },
        // --- Methods expected by DataTableFilter ---
        getFilterValue: () => {
          // Return the { operator, values } structure expected by the filter components
          const currentFilter = filters.find((f) => f.column === col.name)
          return parseFilterState(currentFilter) // Parse the string value back into structured object
        },
        setFilterValue: (valueUpdater: any) => {
          // `valueUpdater` is likely the { operator, values } object or undefined
          const newFilters = [...filters]
          const existingFilterIndex = newFilters.findIndex((f) => f.column === col.name)
          const newValue =
            typeof valueUpdater === 'function'
              ? valueUpdater(parseFilterState(newFilters[existingFilterIndex])) // Handle functional update
              : valueUpdater

          if (newValue === undefined || newValue === null) {
            // Clearing filter
            if (existingFilterIndex !== -1) {
              newFilters.splice(existingFilterIndex, 1)
            }
          } else {
            // Setting/updating filter
            // Convert { operator, values } back to flat { column, operator, value: string }
            const filterToApply: Filter = {
              column: col.name,
              operator: newValue.operator,
              value: serializeFilterValues(newValue.values), // Serialize values into string
            }

            if (existingFilterIndex !== -1) {
              newFilters[existingFilterIndex] = filterToApply
            } else {
              newFilters.push(filterToApply)
            }
          }
          onApplyFilters(newFilters)
        },
        getFacetedMinMaxValues: () => {
          // TODO: Implement if needed by iterating rowsFromQuery.
          return undefined
        },
        getCanFilter: () => true, // Assume all columns from snap are filterable via this UI for now
        // Add other Column methods if needed
      }
    })

    // --- Methods/Properties expected by DataTableFilter on the table object ---
    const tableObject = {
      getAllColumns: () => tanstackColumns,
      getColumn: (id: string) => tanstackColumns.find((col: { id: string }) => col.id === id),
      getState: () => ({
        // Adapt our Filter[] state to the { id: string, value: { operator, values } }[] format
        columnFilters: filters.map((f) => ({
          id: f.column,
          value: parseFilterState(f), // Parse string value back into object
        })),
        sorting: sorts,
        globalFilter: '',
        // Add other state if needed (rowSelection, pagination etc.)
      }),
      setColumnFilters: (updater: any) => {
        let newAdaptedFilters: { id: string; value: any }[]
        if (typeof updater === 'function') {
          const currentAdaptedFilters = filters.map((f) => ({
            id: f.column,
            value: parseFilterState(f),
          }))
          newAdaptedFilters = updater(currentAdaptedFilters)
        } else {
          newAdaptedFilters = updater // Expects array [{ id, value }]
        }

        // Map back to the flat Filter[] structure expected by onApplyFilters
        const newInternalFilters = newAdaptedFilters
          .map((f: { id: string; value: { operator: string; values: any[] } | undefined }) => {
            if (!f.value) return null // Filter was cleared
            return {
              column: f.id,
              operator: f.value.operator,
              value: serializeFilterValues(f.value.values), // Serialize back to string
            }
          })
          .filter((f): f is Filter => f !== null) // Remove nulls and type guard

        onApplyFilters(newInternalFilters)
      },
      setGlobalFilter: (value: string) => {
        console.warn('setGlobalFilter not implemented in adapter')
      },
      getCoreRowModel: () => ({
        rows: rowsFromQuery.map((row: TData, index: number) => ({
          id: String(index), // Basic row ID
          original: row,
          getValue: (columnId: string) => row[columnId as keyof TData],
          // Add other Row methods if needed
        })),
        // Add other RowModel properties if needed
        flatRows: [], // Placeholder
        rowsById: {}, // Placeholder
      }),
      // --- Dummy/Placeholder Methods & Properties ---
      // Add placeholder implementations for potentially missing methods/props
      // required by Table<TData> to satisfy TypeScript and avoid runtime errors,
      // even if DataTableFilter doesn't strictly use them.
      _features: [],
      _getAllFlatColumnsById: () => ({}),
      _getColumnDefs: () => [],
      _getDefaultColumnDef: () => ({}),
      _getCoreRowModel: () => tableObject.getCoreRowModel(), // Reuse implemented one
      getSelectedRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }), // Dummy implementation
      // ... add more placeholders as needed based on TS errors
      // It's tedious, but helps satisfy the type assertion.
    }

    // Assert type to satisfy DataTableFilter prop type.
    // This requires the tableObject to implement *enough* of the Table interface.
    // We may need to add more dummy methods/properties above.
    return tableObject as unknown as Table<TData>
  }, [snap.table?.columns, filters, onApplyFilters, tableData, sorts])
}
