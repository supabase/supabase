import { useRouter } from 'next/router'
import { useMemo } from 'react'

/**
 * Helper to convert kebab case to camel case
 */
function convertToCamelCase(key: string): string {
  if (!key.includes('-')) {
    return key
  }

  const parts = key.split('-')
  const capitalizedParts = parts.map((part, index) => {
    if (index === 0) {
      return part
    }
    return part.charAt(0).toUpperCase() + part.slice(1)
  })
  return capitalizedParts.join('')
}

export function useParams(): {
  [k: string]: string | undefined
} {
  const { query } = useRouter()

  const modifiedQuery = {
    ...query,
  }

  // Convert kebab case keys to camel case
  Object.keys(modifiedQuery).forEach((key) => {
    const modifiedKey = convertToCamelCase(key)
    if (modifiedKey !== key) {
      modifiedQuery[modifiedKey] = modifiedQuery[key]
      delete modifiedQuery[key]
    }
  })

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(modifiedQuery).map(([key, value]) => {
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
