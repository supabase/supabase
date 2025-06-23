# UnifiedLogs Inspection Panel Architecture

## Overview

The UnifiedLogs inspection panel is a sophisticated **right-side detail panel** that appears when users click on log entries in the unified logs table. This document outlines how the inspection system works, its components, and their interactions for future refactoring reference.

## High-Level Architecture

```
┌─────────────────┬─────────────────────────────────────┬─────────────────────┐
│   FilterSideBar │            Main Logs Table          │  Inspection Panel  │
│                 │                                     │                     │
│  ┌──────────┐   │  ┌─────────────────────────────┐    │  ┌───────────────┐  │
│  │ Filters  │   │  │        Log Entries          │    │  │  Sheet Header │  │
│  │          │   │  │                             │    │  │               │  │
│  │ - Level  │   │  │ [Selected Row Highlighted]  │    │  │  Navigation   │  │
│  │ - Type   │   │  │                             │    │  │  Controls     │  │
│  │ - Status │   │  │                             │    │  │               │  │
│  │ - etc    │   │  └─────────────────────────────┘    │  ├───────────────┤  │
│  └──────────┘   │                                     │  │               │  │
│                 │  ┌─────────────────────────────┐    │  │  Log Details  │  │
└─────────────────┤  │     Function Logs Tab      │    │  │               │  │
                  │  │  (if log_count > 0)         │    │  │  Field List   │  │
                  │  └─────────────────────────────┘    │  │               │  │
                  └─────────────────────────────────────┤  └───────────────┘  │
                                                        └─────────────────────┘
```

## Component Hierarchy

### 1. Layout System (Resizable Panels)

**`ResizablePanelGroup`** - Root container for horizontal layout

- **`ResizablePanel`** (main) - Contains logs table + function logs
  - **`ResizablePanelGroup`** (vertical) - Contains main table + function logs
    - **`ResizablePanel`** - Main logs table
    - **`ResizablePanel`** - Function logs (conditional)
- **`ResizableHandle`** - Draggable separator
- **`ResizablePanel`** (inspection) - Inspection panel (conditional)

### 2. Inspection Panel Components

#### **DataTableSheetDetails** (`apps/studio/components/ui/DataTable/DataTableSheetDetails.tsx`)

**Purpose**: Provides the header and navigation controls for the inspection panel

**Key Features**:

- **Header with title** - Shows pathname of selected log
- **Navigation controls** - Up/down arrows to navigate between log entries
- **Close button** - X to close the inspection panel
- **Keyboard shortcuts** - Arrow keys for navigation (when not in dropdown menus)

**State Management**:

```typescript
// Finds the selected row from table data
const selectedRow = useMemo(() => {
  if (isLoading && !selectedRowKey) return
  return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
}, [selectedRowKey, isLoading])

// Navigation logic
const nextId = useMemo(() => table.getCoreRowModel().flatRows[index + 1]?.id, [index, isLoading])
const prevId = useMemo(() => table.getCoreRowModel().flatRows[index - 1]?.id, [index, isLoading])
```

**Navigation Behavior**:

- **Arrow keys**: Navigate up/down through log entries
- **Menu detection**: Prevents navigation when dropdown menus are open
- **Row selection**: Updates table row selection state

#### **MemoizedDataTableSheetContent** (`apps/studio/components/interfaces/UnifiedLogs/components/DataTableSheetContent.tsx`)

**Purpose**: Renders the detailed field information for the selected log entry

**Key Features**:

- **Field rendering** - Displays log data based on `sheetFields` configuration
- **Conditional display** - Some fields only show when data is present
- **Custom components** - Each field type can have custom rendering
- **Performance optimization** - Memoized to prevent unnecessary re-renders

**Field Types**:

```typescript
type SheetField = {
  id: keyof TData
  label: string
  type: 'readonly' | 'input' | 'checkbox' | 'slider' | 'timerange'
  component?: (props: TData & metadata) => JSX.Element
  condition?: (props: TData) => boolean // Conditional rendering
  className?: string
  skeletonClassName?: string
}
```

**Rendering Logic**:

```typescript
// Two rendering modes based on field type
{field.type === 'readonly' ? (
  // Read-only fields (like Request ID)
  <div className="flex gap-4 my-1 py-1 text-sm justify-between items-center">
    <dt>{field.label}</dt>
    <dd>{Component ? <Component {...data} metadata={metadata} /> : value}</dd>
  </div>
) : (
  // Interactive fields with right-click actions
  <DataTableSheetRowAction
    fieldValue={field.id}
    filterFields={filterFields}
    value={value}
    table={table}
  >
    <dt>{field.label}</dt>
    <dd>{Component ? <Component {...data} metadata={metadata} /> : value}</dd>
  </DataTableSheetRowAction>
)}
```

#### **DataTableSheetRowAction** (`apps/studio/components/ui/DataTable/DataTableSheetRowAction.tsx`)

**Purpose**: Provides interactive right-click context menus for log fields

**Key Features**:

- **Field-specific actions** - Different actions based on field type
- **Copy functionality** - Copy any field value to clipboard
- **Filter integration** - Add field values to active filters
- **Time-based filtering** - Special actions for date/time fields

**Action Types by Field**:

1. **Checkbox fields** (status, method, level):

   - **Include** - Add value to filter array

2. **Input fields** (host, pathname, auth_user):

   - **Include** - Set exact filter value

3. **Slider fields** (latency, timing values):

   - **Less or equal than** - Set upper bound
   - **Greater or equal than** - Set lower bound
   - **Equal to** - Set exact value

4. **Timerange fields** (date):

   - **Exact timestamp** - Filter to exact time
   - **Same hour** - Filter to same hour range
   - **Same day** - Filter to same day range

5. **All fields**:
   - **Copy value** - Copy to clipboard with feedback

### 3. Data Flow

#### **Selection State Management**

```typescript
// UnifiedLogs.tsx - Main component state
const [rowSelection, setRowSelection] = useState<RowSelectionState>(defaultRowSelection)

// Selected row derived from selection state
const selectedRow = useMemo(() => {
  if ((isLoading || isFetching) && !flatData.length) return
  const selectedRowKey = Object.keys(rowSelection)?.[0]
  return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
}, [rowSelection, table, isLoading, isFetching, flatData])
```

#### **Panel Visibility Logic**

```typescript
// Panel only renders when a row is selected
{selectedRowKey && (
  <>
    <ResizableHandle withHandle />
    <ResizablePanel defaultSize={45} minSize={45}>
      {/* Inspection panel content */}
    </ResizablePanel>
  </>
)}
```

#### **URL State Synchronization**

```typescript
// URL state sync for selected log
useEffect(() => {
  if (isLoading || isFetching) return
  if (Object.keys(rowSelection)?.length && !selectedRow) {
    setSearch({ uuid: null }) // Clear URL if row not found
    setRowSelection({})
  } else {
    setSearch({ uuid: Object.keys(rowSelection)?.[0] || null }) // Update URL
  }
}, [rowSelection, selectedRow, isLoading, isFetching])
```

### 4. Field Configuration System

#### **Sheet Fields** (`UnifiedLogs.fields.tsx`)

Defines what fields appear in the inspection panel:

```typescript
export const sheetFields = [
  {
    id: 'uuid',
    label: 'Request ID',
    type: 'readonly',
    skeletonClassName: 'w-64',
  },
  {
    id: 'date',
    label: 'Date',
    type: 'timerange',
    component: (props) => {
      // Custom date formatting component
      const date = new Date(props.date)
      return (
        <div className="font-mono whitespace-nowrap flex items-center gap-1 justify-end">
          <span>{format(date, 'LLL')}</span>
          <span className="text-foreground/50">·</span>
          <span>{format(date, 'dd')}</span>
          {/* ... more date parts */}
        </div>
      )
    },
    skeletonClassName: 'w-36',
  },
  {
    id: 'auth_user',
    label: 'Auth User',
    type: 'readonly',
    condition: (props) => Boolean(props.auth_user),  // Only show if user exists
    component: (props) => (
      <div className="flex items-center gap-2">
        <User size={14} className="text-foreground-lighter" />
        <span className="font-mono">{props.auth_user}</span>
      </div>
    ),
    skeletonClassName: 'w-56',
  },
  // ... more fields
] satisfies SheetField<ColumnSchema, LogsMeta>[]
```

### 5. Additional Features

#### **Function Logs Tab**

When a log entry has `log_count > 0`, a second panel appears below the main table showing function execution logs:

```typescript
{selectedRow?.original?.logs && selectedRow?.original?.logs?.length > 0 && (
  <>
    <ResizableHandle withHandle />
    <ResizablePanel defaultSize={20} minSize={20}>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-medium">
            Function Logs ({selectedRow?.original?.logs?.length})
          </h3>
        </div>
        <div className="flex-grow overflow-auto">
          <FunctionLogsTab logs={selectedRow?.original?.logs} />
        </div>
      </div>
    </ResizablePanel>
  </>
)}
```

#### **Tabs System**

The inspection panel uses Shadcn tabs for future extensibility:

```typescript
<Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="flex gap-3 px-5">
    <TabsTrigger value="details">Log Details</TabsTrigger>
    {/* Future tabs can be added here */}
  </TabsList>

  <TabsContent value="details">
    <MemoizedDataTableSheetContent ... />
  </TabsContent>
</Tabs>
```

#### **Event Bus for External Navigation**

Components can trigger navigation to specific logs:

```typescript
// Event bus setup
export const logEventBus = {
  listeners: new Map<string, Set<(...args: any[]) => void>>(),

  on(event: 'selectTraceTab', callback: (rowId: string) => void) {
    // ... subscription logic
  },

  emit(event: 'selectTraceTab', rowId: string) {
    // ... emission logic
  },
}

// Usage in UnifiedLogs component
useEffect(() => {
  const unsubscribe = logEventBus.on('selectTraceTab', (rowId) => {
    setRowSelection({ [rowId]: true })
    setActiveTab('trace')
  })
  return unsubscribe
}, [setRowSelection])
```

### 6. Context System

#### **DataTableProvider** (`apps/studio/components/ui/DataTable/providers/DataTableProvider.tsx`)

Provides shared state and configuration to all child components:

```typescript
interface DataTableContextType<TData = unknown, TValue = unknown> {
  // Table instance
  table: Table<TData>

  // Field configurations
  filterFields: DataTableFilterField<TData>[]
  columns: ColumnDef<TData, TValue>[]

  // State
  columnFilters: ColumnFiltersState
  sorting: SortingState
  rowSelection: RowSelectionState
  columnOrder: string[]
  columnVisibility: VisibilityState

  // Loading state
  isLoading?: boolean

  // Faceted values for filters
  getFacetedUniqueValues?: (table: Table<TData>, columnId: string) => Map<string, number>
  getFacetedMinMaxValues?: (table: Table<TData>, columnId: string) => [number, number]
}
```

### 7. Performance Optimizations

#### **Memoization**

- **`MemoizedDataTableSheetContent`** - Only re-renders when selected data changes
- **Row selection logic** - Memoized to prevent unnecessary computations
- **Navigation IDs** - Memoized to prevent recalculation

#### **Virtual Scrolling**

The main logs table uses `DataTableInfinite` for:

- **Infinite scrolling** - Load more data as user scrolls
- **Live mode** - Real-time updates with `LiveButton` and `LiveRow`
- **Cursor-based pagination** - Efficient large dataset handling

### 8. Key Dependencies

- **`@tanstack/react-table`** - Table state management and row selection
- **`react-resizable-panels`** - Resizable layout system
- **`nuqs`** - URL state synchronization
- **`@tanstack/react-query`** - Data fetching and caching
- **Custom UI components** - Tabs, tooltips, dropdowns from internal UI library

## Future Refactoring Considerations

### 1. **Separation of Concerns**

- Move data fetching logic from `QueryOptions.ts` to dedicated data layer
- Extract field configuration to separate files
- Create dedicated hooks for selection and navigation logic

### 2. **Type Safety**

- Better typing for field configurations and components
- Generic constraints for sheet field types
- Stricter typing for event bus system

### 3. **Component Architecture**

- Consider compound component pattern for sheet details
- Extract navigation logic to custom hook
- Create dedicated context for inspection panel state

### 4. **Performance**

- Implement virtual scrolling for large field lists
- Optimize re-renders with better memoization strategies
- Consider lazy loading for heavy field components

### 5. **Accessibility**

- Add proper ARIA labels and roles
- Implement keyboard navigation standards
- Improve screen reader support for complex interactions

This architecture provides a flexible, performant system for detailed log inspection while maintaining good separation of concerns and extensibility for future features.
