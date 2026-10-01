import { useSyncExternalStore } from 'react'

interface UseQueryVariantParams<T extends string> {
  key: string
  options: readonly T[]
  fallback: T
}

const subscribeToHistory = (onChange: () => void) => {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

export const useQueryVariant = <T extends string>({
  key,
  options,
  fallback,
}: UseQueryVariantParams<T>): T => {
  const value = useSyncExternalStore(
    subscribeToHistory,
    () => new URLSearchParams(window.location.search).get(key),
    () => null
  )
  return options.find((option) => option === value) ?? fallback
}
