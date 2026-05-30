export const COLUMN_MIN_WIDTH = 100

export const STORAGE_KEY_PREFIX = 'supabase_grid'

export const TOTAL_ROWS_INITIAL = -1
export const TOTAL_ROWS_RESET = -2

export const SELECT_COLUMN_KEY = 'supabase-grid-select-row'
export const ADD_COLUMN_KEY = 'supabase-grid-add-column'

const RLS_ACKNOWLEDGED_KEY = 'supabase-acknowledge-rls-warning'

export const rlsAcknowledgedKey = (tableID?: string | number) =>
  `${RLS_ACKNOWLEDGED_KEY}-${String(tableID)}`
