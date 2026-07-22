// [Joshen] These are opinionated thresholds for when things might need attention
// For queries in "active" state - show warning variant if running longer than 30 seconds
// - Typically Not a problem unless its running longer than expected
// For queries in "idle in transaction" state - show warning variant if running longer than 30 seconds
// - Shorter threshold as it indicates a lock
export const WARN_DURATION_ACTIVE_QUERY = 30 // seconds
export const WARN_DURATION_IDLE_TXN = 10 // seconds

export const QUERY_STATE_TOOLTIP = {
  ['active']: 'Currently executing a query.',
  ['idle']: 'Connected, but not currently running a query.',
  ['disabled']: 'Activity tracking is disabled for this session.',
  ['idle in transaction']: 'Has an open transaction but isn’t currently running a query.',
  ['idle in transaction (aborted)']:
    'The last statement in this transaction failed and hasn’t been rolled back yet.',
  ['fastpath function call']:
    'Executing a function call via Postgres’s low-level fastpath protocol.',
}
