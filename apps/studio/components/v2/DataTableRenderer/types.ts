import type { ReactNode } from 'react'

// ─── Column Definition ────────────────────────────────────────────────────────

export interface DataTableColumn<T = any> {
  id: string
  name: string
  width?: number
  minWidth?: number
  sortable?: boolean // default: true
  resizable?: boolean // default: true
  frozen?: boolean
  align?: 'left' | 'center' | 'right'

  // Cell type hint for default rendering when renderCell is omitted
  type?: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'badge' | 'code' | 'json' | 'avatar'

  // For 'badge' type: map values to badge variants
  badgeMap?: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'default' }
  >

  // Copy-on-click (e.g., for IDs, UUIDs, keys)
  copyable?: boolean

  // Whether this column supports inline editing (requires props.editable too)
  editable?: boolean

  // Custom cell renderer — if omitted, type hint is used
  renderCell?: (value: any, row: T, rowIndex: number) => ReactNode

  // Custom header renderer — if omitted, name string is used
  renderHeader?: () => ReactNode
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

export interface SortState {
  columnId: string
  direction: 'asc' | 'desc'
}

// ─── Filtering ───────────────────────────────────────────────────────────────

export interface FilterDefinition {
  id: string
  label: string
  type: 'search' | 'select' | 'multi-select' | 'toggle'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  render?: (args: {
    value: string | string[] | boolean | undefined
    onChange: (value: string | string[] | boolean) => void
    filterState: FilterState
  }) => ReactNode
}

export type FilterState = Record<string, string | string[] | boolean>

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

export interface RowAction<T = any> {
  id: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'danger'
  disabled?: boolean | ((row: T) => boolean)
  onClick: (row: T) => void
}

// ─── Bulk Actions ─────────────────────────────────────────────────────────────

export interface BulkAction<T = any> {
  id: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'danger'
  onClick: (selectedRows: T[]) => void
}

// ─── Editing ─────────────────────────────────────────────────────────────────

export interface EditingCell {
  rowKey: string
  columnId: string
}

// ─── Main Props ───────────────────────────────────────────────────────────────

export interface DataTableRendererProps<T extends Record<string, any> = any> {
  // ── Data (required) ──
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: string | ((row: T) => string)

  // ── State ──
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void

  // ── Sorting (controlled) ──
  // If omitted, sorting is handled client-side internally
  sort?: SortState | null
  onSortChange?: (sort: SortState | null) => void
  renderSortControl?: (args: {
    sort: SortState | null
    onSortChange: (sort: SortState | null) => void
  }) => ReactNode

  // ── Filtering (controlled) ──
  // If omitted, filtering is handled client-side when filters is defined
  filters?: FilterDefinition[]
  filterState?: FilterState
  onFilterChange?: (state: FilterState) => void

  // ── Pagination (controlled) ──
  // If omitted, all rows render with virtualization
  pagination?: PaginationState
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void

  // ── Selection ──
  selectable?: boolean
  selectedRows?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void

  // ── Row interaction ──
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  rowActions?: RowAction<T>[]

  // ── Bulk actions (shown when rows are selected) ──
  bulkActions?: BulkAction<T>[]

  // ── Inline editing ──
  editable?: boolean
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown) => void | Promise<void>

  // ── Toolbar slots ──
  toolbarLeft?: ReactNode
  toolbarRight?: ReactNode

  // ── Empty state ──
  emptyState?: {
    title: string
    description?: string
    icon?: ReactNode
    action?: { label: string; onClick: () => void }
  }

  // ── Visual ──
  compact?: boolean
  stickyHeader?: boolean

  /** Hide the built-in filter/toolbar row (e.g. when embedding under Table Editor / SupabaseGrid `Header`) */
  hideToolbar?: boolean

  /** Optional class on the root wrapper (e.g. `min-h-0 flex-1`) */
  className?: string
}
