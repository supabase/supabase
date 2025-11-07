/*
 * next/compat/router is used so that this doesn't cause an error on App
 * Router builds. However, no replacement for the functionality is provided if
 * the router is missing (it just silently fails).
 *
 * This is fine because docs (the only site moving to App Router right now)
 * doesn't use this hook. Skipping it silently is less troublesome than trying
 * to make it work across both routers -- making search params work seamlessly
 * is a giant pain, and too much critical studio functionality depends on this
 * to mess with it lightly.
 */
import { useRouter } from 'next/compat/router'
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
  const router = useRouter()
  const query = router?.query

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
