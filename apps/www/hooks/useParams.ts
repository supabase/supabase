import { useRouter } from 'next/router'
import { useMemo } from 'react'

export function useParams(): {
  [k: string]: string | undefined
} {
  const { query } = useRouter()

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(query).map(([key, value]) => {
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
