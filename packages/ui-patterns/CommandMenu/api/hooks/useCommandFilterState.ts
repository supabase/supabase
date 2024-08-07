import { useCommandState } from 'cmdk'

export function useCommandFilterState(selector: Parameters<typeof useCommandState>[0]) {
  const selectedValue = useCommandState(selector)
  return selectedValue
}
