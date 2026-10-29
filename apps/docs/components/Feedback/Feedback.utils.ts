export const TAB_PARAM_KEY_PATTERN = /^[A-Za-z0-9_-]{1,40}$/

// rejects jwts, emails, urls and sb_ api keys
export const TAB_PARAM_VALUE_PATTERN = /^(?!sb_)[a-z0-9 _-]{1,64}$/i

export const MAX_TAB_PARAMS = 10

export const MAX_PATHNAME_LENGTH = 256

export const sanitizeTabParams = (search: string): Record<string, string> => {
  const searchParams = new URLSearchParams(search)
  const queryGroups = new Set(searchParams.getAll('queryGroups'))

  const entries = [...queryGroups].flatMap((key) => {
    const value = searchParams.get(key)
    if (!value || !TAB_PARAM_KEY_PATTERN.test(key) || !TAB_PARAM_VALUE_PATTERN.test(value)) {
      return []
    }
    return [[key, value] as const]
  })

  return Object.fromEntries(entries.slice(0, MAX_TAB_PARAMS))
}

export const getSanitizedTabParams = (): Record<string, string> =>
  sanitizeTabParams(window.location.search)

export const toSafePathname = (path: string): string =>
  path.replace(/[?#][\s\S]*$/, '').slice(0, MAX_PATHNAME_LENGTH)
