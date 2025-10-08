import { useQueryState } from 'nuqs'

export function useSelectedLog() {
  return useQueryState('log')
}
