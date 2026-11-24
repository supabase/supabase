import { useMemo } from 'react'

import { useFramework } from '../framework'

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
  const { params } = useFramework()

  return useMemo(() => {
    if (!params) return {}

    const entries: Array<[string, string | undefined]> = []
    for (const [key, value] of Object.entries(params)) {
      const normalizedKey = convertToCamelCase(key)
      entries.push([normalizedKey, Array.isArray(value) ? value[0] : value])
    }
    return Object.fromEntries(entries)
  }, [params])
}
