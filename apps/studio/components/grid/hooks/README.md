# Table State Management

This document outlines how the filter and sort state is managed across URL parameters, browser local storage, React hooks, and the Valtio state store.

## Overview

The table filtering and sorting system uses a URL-based state persistence pattern combined with custom hooks that abstract the implementation details from consuming components. This architecture provides several benefits:

- **Persistent state**: Filters and sorts are stored in URL parameters, enabling bookmarking and sharing
- **Separation of concerns**: Logic is separated from UI components
- **Draft-then-apply pattern**: UI components maintain draft state until explicitly applied

## Components of State Management

1. **URL Parameters (`filter`, `sort`, `hidden_cols`, `col_order`)**

   - **Role:** Represents the _active_ state for the current session. Makes the view shareable and bookmarkable.
   - **Interaction:**
     - Read by hooks on component render using `next/router` and `URLSearchParams`
     - Written to when state changes are intentionally applied (e.g., "Apply Filters" clicked)

2. **Browser Local Storage (`supabase_grid_state_...`)**

   - **Role:** Persistent storage across browser sessions. Acts as fallback when revisiting without URL parameters.
   - **Interaction:**
     - Written to by the `saveTableEditorStateToLocalStorage` utility
     - Read by `loadTableEditorStateFromLocalStorage` utility

3. **React Hooks (Composition)**

   - **Role:** Orchestrate state flow between URL, UI interactions, local storage, and Valtio store
   - **Key Hooks:** Detailed in the "Core Hooks" section below

4. **Valtio Store (`store`) / Snapshots (`snap`)**
   - **Role:** Manages complementary UI state (pagination, loading, etc.)
   - **Examples:** Current page, rows per page, table metadata, cell selection/editing state
   - **Interaction:**
     - Read by hooks for context (table name, etc.)
     - Read by components for UI rendering
     - Written to by hooks to trigger side effects (resetting pagination when filters change)

## Core Hooks

### `useTableEditorFiltersSort`

The foundation hook that directly interacts with URL parameters:

- Reads and writes raw filter/sort strings to URL parameters
- Provides `setParams` function to update URL
- Used by more specialized hooks

### `useTableFilter`

```typescript
// Returns: { filters, urlFilters, onApplyFilters }
```

The `useTableFilter` hook manages filter state with these responsibilities:

- Retrieves raw filter parameters from URL
- Formats filter parameters into usable Filter[] objects
- Provides a callback to apply new filters
- Persists changes to URL parameters
- Triggers side effects through `saveFiltersAndTriggerSideEffects`

Key design aspects:

- No direct snapshot interaction, keeping it focused solely on filter management
- Uses URL parameters as the source of truth
- Forwards filter changes to URL and triggers application-specific side effects

### `useTableSort`

```typescript
// Returns: { sorts, urlSorts, onApplySorts }
```

The `useTableSort` hook manages sort state with these responsibilities:

- Retrieves raw filter parameters from URL
- Formats sort parameters into usable Sort[] objects (needs table name)
- Provides a callback to apply new sorts
- Persists changes to URL parameters
- Triggers side effects through `saveSortsAndTriggerSideEffects`

Key design aspects:

- Uses safe snapshot ONLY to get table name for formatting
- Handles applying table name to sort objects
- Maintains URL parameters as source of truth
- Forwards sort changes to URL and triggers application-specific side effects

### `useSafeTableEditorSnapshot`

```typescript
// Returns: Partial<TableEditorTableState>
```

This hook exists is to satisfy React's rules of hooks:

React hooks CANNOT be called conditionally. Since `useTableSort` is a hook that needs table state, we cannot write:

```typescript
// THIS VIOLATES REACT'S RULES - NOT ALLOWED
function useTableSort() {
  const { sorts: urlSorts } = useTableEditorFiltersSort()

  // Conditional hook usage is forbidden in React!
  const snap = hasTableContext ? useTableEditorTableStateSnapshot() : null

  // ...rest of hook
}
```

Instead, we created `useSafeTableEditorSnapshot` which unconditionally calls the original snapshot hook and handles error cases. This allows `useTableSort` to always call the hook safely regardless of context.

### `useSaveTableEditorState`

Provides functions to save state and trigger side effects:

- Functions like `saveFiltersAndTriggerSideEffects` that are called by filter/sort hooks
- Reads context from the Valtio snapshot (table name, etc.)
- Calls `saveTableEditorStateToLocalStorage` to write to local storage
- Modifies the Valtio store (e.g., resetting pagination) to trigger side effects

### `useLoadTableEditorStateFromLocalStorageIntoUrl`

Handles initial load logic:

- Checks for existing URL parameters
- If empty, reads from local storage and updates URL
- Ensures state persistence across page loads

## Component Implementation

### FilterPopoverPrimitive and SortPopoverPrimitive

These components follow a "draft and apply" pattern:

1. **Local state management**: Both components maintain a local state copy of filters/sorts
2. **Edit operations**: Changes like adding, modifying, or deleting are made to the local state
3. **Apply operations**: Only when the user clicks "Apply" are the changes committed via the callback
4. **Synchronization**: Local state is synchronized with props when external changes occur

### SortPopoverPrimitive Implementation

The SortPopoverPrimitive component:

1. **UI state**: Uses local state (`localSorts`) for all UI rendering to ensure consistent display

   ```tsx
   // UI elements reference localSorts, not props
   <Button type={localSorts.length > 0 ? 'link' : 'text'} icon={<List />}>
     {displayButtonText}
   </Button>
   ```

2. **Change detection**: Implements property-specific comparison for "Apply" button state

   ```tsx
   // Compare relevant properties instead of full object equality
   const hasChanges = useMemo(() => {
     if (localSorts.length !== sorts.length) return true

     return localSorts.some((localSort, index) => {
       const propSort = sorts[index]
       return (
         !propSort ||
         localSort.column !== propSort.column ||
         localSort.ascending !== propSort.ascending
       )
     })
   }, [localSorts, sorts])
   ```

### SortPopover Implementation

The SortPopover component connects the hooks to the primitive component:

```tsx
const SortPopover = ({ portal = true }: SortPopoverProps) => {
  const { urlSorts, onApplySorts } = useTableSort()
  const tableState = useTableEditorTableStateSnapshot()
  const tableName = tableState?.table?.name || ''

  // Convert string[] to Sort[]
  const sorts = useMemo(() => {
    return tableName && urlSorts ? formatSortURLParams(tableName, urlSorts) : []
  }, [tableName, urlSorts])

  return <SortPopoverPrimitive portal={portal} sorts={sorts} onApplySorts={onApplySorts} />
}
```

This implementation directly uses hooks to access state rather than using global variables.

## Interaction Flows

### Flow: Applying a Filter

1. User interacts with `FilterPopover.tsx` UI and clicks "Apply"
2. `FilterPopover.tsx` calls the `onApplyFilters` callback from `useTableFilter()`
3. Inside `onApplyFilters`:
   - Filter state is formatted into URL string array
   - `setParams` updates the URL parameter
   - `saveFiltersAndTriggerSideEffects` is called to persist to local storage
4. Inside `saveFiltersAndTriggerSideEffects`:
   - Reads table name from Valtio snapshot
   - Saves to local storage
   - Resets pagination in Valtio store
5. URL and Valtio changes trigger re-renders
6. Components re-fetch data with new filter state and reset pagination

### Flow: Initial Page Load (No URL Params)

1. User navigates to table page without specific params
2. `useLoadTableEditorStateFromLocalStorageIntoUrl` hook runs
3. It checks for URL params, finds none
4. It loads previous state from local storage
5. It updates the URL with the loaded state
6. URL change triggers re-render with restored state

## Component Usage Pattern

Components using these hooks should follow this pattern:

```tsx
function TableComponent() {
  // Get filter data and callbacks
  const { filters, onApplyFilters } = useTableFilter()

  // Get sort data and callbacks
  const { sorts, onApplySorts } = useTableSort()

  return (
    <>
      <FilterPopoverPrimitive filters={filters} onApplyFilters={onApplyFilters} />

      <SortPopoverPrimitive sorts={sorts} onApplySorts={onApplySorts} />

      {/* Table rendering with filters and sorts applied */}
    </>
  )
}
```

## Implementation Notes

- Filter and sort parameters are stored in URL using specific formats
- Conversion utilities (`formatFilterURLParams`, `formatSortURLParams`, etc.) handle translation between URL strings and typed objects
- Side effect hooks manage database persistence and related operations
- When implementing new components, always maintain deep copies when updating state to avoid reference issues
- Generate stable keys when rendering lists to improve reconciliation
