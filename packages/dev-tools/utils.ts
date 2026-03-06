export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const escapedName = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(^| )${escapedName}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : undefined
}

export function setCookie(name: string, value: string, path: string = '/') {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}`
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function safeJsonParse<T>(value: string | undefined, fallback: T, context?: string): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DevToolbar] Failed to parse JSON${context ? ` for ${context}` : ''}:`, error)
    }
    return fallback
  }
}

export const PH_ORIGINALS_KEY = 'devToolbarFlagOriginals:posthog'
export const CC_ORIGINALS_KEY = 'devToolbarFlagOriginals:configcat'

export function readOriginals(
  key: typeof PH_ORIGINALS_KEY | typeof CC_ORIGINALS_KEY
): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DevToolbar] Failed to read originals from ${key}:`, error)
    }
    return {}
  }
}

export function writeOriginals(
  key: typeof PH_ORIGINALS_KEY | typeof CC_ORIGINALS_KEY,
  value: Record<string, unknown>
) {
  if (typeof window === 'undefined') return
  if (Object.keys(value).length === 0) {
    window.localStorage.removeItem(key)
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function valuesAreEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a === 'number' || typeof b === 'number') {
    const numA = Number(a)
    const numB = Number(b)
    if (Number.isNaN(numA) || Number.isNaN(numB)) return false
    return numA === numB
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return a === b
  }
  return String(a) === String(b)
}

export function parseOverrideValue(value: unknown, original: unknown): unknown {
  if (typeof original === 'number') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? original : parsed
  }
  if (typeof original === 'boolean') {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true'
    }
    return Boolean(value)
  }
  if (typeof original === 'string') {
    return String(value)
  }
  return value
}
