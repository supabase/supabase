import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export function useParams(): {
  [k: string]: string | undefined
} {
  const query = useSearchParams()

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries([query?.entries]).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [key, value[0]]
          } else {
            return [key, value]
          }
        })
      ),
    [query]
  )
}
