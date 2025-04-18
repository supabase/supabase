import { useQueryState } from 'nuqs'

// Used in logs and warehouse.
export function useSelectedLog() {
  return useQueryState('log')
}
