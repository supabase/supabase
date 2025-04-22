# Table View State Management (Filters, Sorts, etc.)

This document outlines how the state for the table view (specifically filters, sorts, column visibility, and column order) is managed across URL parameters, browser local storage, React hooks, and the Valtio state store.

## Components of State Management

1.  **URL Parameters (`filter`, `sort`, `hidden_cols`, `col_order`)**

    - **Role:** Represents the _active_ state for the current browser session/page load. This makes the specific view (filters, sorts applied) shareable via the URL and bookmarkable. It's the primary source of truth for the _current_ session.
    - **Interaction:**
      - Read by the `useTableEditorFiltersSort` hook on component render/navigation using `next/router` and `URLSearchParams`.
      - Written to by `useTableEditorFiltersSort` (via its `setParams` function) when state changes are intentionally applied (e.g., user clicks "Apply Filters").

2.  **Browser Local Storage (`supabase_grid_state_...`)**

    - **Role:** Persistent storage across browser sessions. Acts as a fallback or memory to restore the _last used_ state when the user revisits the table view _without_ specific parameters in the URL.
    - **Interaction:**
      - Written to by the `saveTableEditorStateToLocalStorage` utility function, which is invoked by the `useSaveTableEditorState` hook.
      - Read by `loadTableEditorStateFromLocalStorage` utility function. This is used by the `useLoadTableEditorStateFromLocalStorageIntoUrl` hook to potentially populate URL parameters if they are missing on initial load.

3.  **React Hooks (Composition)**

    - **Role:** Orchestrate the flow of state between the URL, UI interactions, local storage, and the Valtio store. They encapsulate and centralize the state management logic.
    - **Key Hooks:**
      - `useTableEditorFiltersSort`: Reads/writes raw state strings to/from URL parameters. Provides the `setParams` function.
      - `useTableFilter`, `useTableSort`, `useTableColumnVisibility`, `useTableColumnOrder`:
        - Consume `useTableEditorFiltersSort` to get URL state and the `setParams` function.
        - Use utility functions (e.g., `formatFilterURLParams`) to convert URL strings into structured application state.
        - Provide callbacks (e.g., `onApplyFilters`, `hideColumn`) to the UI.
        - When callbacks are triggered by user interaction, they call `setParams` to update the URL _and_ call functions from `useSaveTableEditorState` to persist the state.
      - `useSaveTableEditorState`:
        - Provides functions (e.g., `saveFiltersAndTriggerSideEffects`) called by the hooks above.
        - Reads necessary context from the Valtio snapshot (`snap.table.name`, `snap.gridColumns`).
        - Calls `saveTableEditorStateToLocalStorage` to write to local storage.
        - Modifies the Valtio store (e.g., `snap.setPage(1)`) to trigger side effects like pagination resets.
      - `useLoadTableEditorStateFromLocalStorageIntoUrl`: Handles the initial load logic, reading from local storage and potentially updating URL parameters if they are empty.

4.  **Valtio Store (`store`) / Snapshots (`snap`)**
    - **Role:** Manages _other_ UI state related to the grid, _complementary_ to the filter/sort/column definitions stored via URL/localStorage.
    - **Managed State Examples:** Current page number (`snap.page`), rows per page (`tableEditorSnap.rowsPerPage`), table metadata (`snap.table.name`), data loading states, cell selection/editing state.
    - **Interaction:**
      - Read by hooks (e.g., `useSaveTableEditorState` needs `snap.table.name` for the local storage key).
      - Read by components for displaying UI elements (e.g., pagination controls use `snap.page`).
      - Read by data fetching hooks (`useTableRowsQuery`) to combine filter/sort state (from URL hooks) with pagination state (from Valtio).
      - Written to by hooks (`useSaveTableEditorState`) to trigger side effects (e.g., `snap.setPage(1)` when filters change).

## Interaction Flows

### Flow: Applying a Filter

1.  User interacts with `FilterPopover.tsx` UI and clicks "Apply".
2.  `FilterPopover.tsx` calls the `onApplyFilters` callback obtained from `useTableFilter()`.
3.  Inside `onApplyFilters` (defined in `useTableFilter`):
    a. The applied filter state is formatted into a URL string array (`filtersToUrlParams`).
    b. `setParams` (from `useTableEditorFiltersSort`) is called to update the `filter` query parameter in the URL.
    c. `saveFiltersAndTriggerSideEffects` (from `useSaveTableEditorState`) is called with the same URL string array.
4.  Inside `saveFiltersAndTriggerSideEffects` (defined in `useSaveTableEditorState`):
    a. It reads the table name/schema from the Valtio snapshot (`snap`).
    b. It calls `saveTableEditorStateToLocalStorage` to persist the filter strings under the correct key.
    c. It modifies the Valtio store (`snap.setPage(1)`) to reset pagination.
5.  The URL change and Valtio state change trigger re-renders.
6.  `SupabaseGrid.tsx` re-renders:
    a. `useTableFilter` re-runs, reads the new URL param via `useTableEditorFiltersSort`, formats it, and returns the updated `filters` state.
    b. `useTableRowsQuery` receives the new `filters` state (and the reset page number from `snap.page`) and re-fetches data.
    c. UI components (`Header`, `Grid`) receive the new `filters` state and updated `rows` and re-render to reflect the changes.

### Flow: Initial Page Load (No URL Params)

1.  User navigates to the table page URL without specific `filter` or `sort` params.
2.  `SupabaseGrid.tsx` mounts.
3.  The `useLoadTableEditorStateFromLocalStorageIntoUrl` hook runs.
    a. It checks `window.location.search` for existing `filter`/`sort` params. None are found.
    b. It calls `loadTableEditorStateFromLocalStorage` to read any previously saved state (filters, sorts) for this table.
    c. If saved state is found, it calls `setParams` (from `useUrlState`) to update the URL query parameters with the loaded filters/sorts.
4.  The URL update triggers a re-render.
5.  On the re-render, `useTableFilter`/`useTableSort` (via `useTableEditorFiltersSort`) read the newly added parameters from the URL.
6.  The rest of the flow proceeds like step 6 in "Applying a Filter", using the state restored from local storage via the URL.

This separation ensures that the URL accurately reflects the shareable state, local storage provides persistence, Valtio handles other UI state, and hooks manage the coordination between them all.
