/** Tooltip text for a disabled create or delete action, or undefined while the grant is loading or granted. */
export function getWriteGrantTooltip(
  status: 'loading' | 'granted' | 'denied' | 'error',
  action: 'create' | 'delete'
) {
  if (status === 'denied') return `You need additional permissions to ${action} API keys`
  if (status === 'error') return `Failed to check permissions to ${action} API keys`
  return undefined
}
