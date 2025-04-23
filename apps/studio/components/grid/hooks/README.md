# Table Filtering and Sorting Architecture

## Overview

The table filtering and sorting system uses a URL-based state persistence pattern combined with custom hooks that abstract the implementation details from consuming components. This architecture provides several benefits:

- **Persistent state**: Filters and sorts are stored in URL parameters, enabling bookmarking and sharing
- **Separation of concerns**: Logic is separated from UI components
- **Draft-then-apply pattern**: UI components maintain draft state until explicitly applied

## Core Hooks

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

## Component Implementation

### FilterPopoverPrimitive and SortPopoverPrimitive

These components follow a "draft and apply" pattern:

1. **Local state management**: Both components maintain a local state copy of filters/sorts
2. **Edit operations**: Changes like adding, modifying, or deleting are made to the local state
3. **Apply operations**: Only when the user clicks "Apply" are the changes committed via the callback
4. **Synchronization**: Local state is synchronized with props when external changes occur

## Data Flow

1. URL parameters store the raw filter/sort state
2. Hooks read and format these parameters into usable objects
3. UI components receive formatted objects and callbacks
4. Components maintain draft state for editing
5. When "Apply" is clicked, callbacks update URL parameters
6. Side effects are triggered via dedicated save hooks

## Component Usage

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
