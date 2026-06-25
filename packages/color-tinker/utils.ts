import { COLOR_INPUTS, VALUES_STORAGE_KEY } from './constants'
import type { ColorValues, StoredThemeValues, ThemeKey } from './types'

export function safeJsonParse<T>(value: string | undefined, fallback: T, context?: string): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ColorTinker] Failed to parse JSON${context ? ` for ${context}` : ''}:`, error)
    }
    return fallback
  }
}

export function formatValue(value: number, decimals: number) {
  return value.toFixed(decimals)
}

export function parseCSSValue(value: string) {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function getThemeKey(resolvedTheme?: string): ThemeKey {
  return resolvedTheme === 'light' ? 'light' : 'dark'
}

export function isColorValues(value: unknown): value is ColorValues {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ColorValues)['--hue'] === 'number'
  )
}

export function readStoredValues(themeKey?: ThemeKey): StoredThemeValues {
  if (typeof localStorage === 'undefined') return {}

  const raw = localStorage.getItem(VALUES_STORAGE_KEY)
  if (!raw) return {}

  const parsed: unknown = safeJsonParse(raw, null, VALUES_STORAGE_KEY)
  if (!parsed || typeof parsed !== 'object') return {}

  if (isColorValues(parsed)) {
    if (!themeKey) return {}
    const migrated = { [themeKey]: parsed }
    writeStoredValues(migrated)
    return migrated
  }

  const stored: StoredThemeValues = {}
  if (isColorValues((parsed as StoredThemeValues).dark)) {
    stored.dark = (parsed as StoredThemeValues).dark
  }
  if (isColorValues((parsed as StoredThemeValues).light)) {
    stored.light = (parsed as StoredThemeValues).light
  }
  return stored
}

export function writeStoredValues(stored: StoredThemeValues) {
  if (typeof localStorage === 'undefined') return

  if (Object.keys(stored).length === 0) {
    localStorage.removeItem(VALUES_STORAGE_KEY)
    return
  }
  localStorage.setItem(VALUES_STORAGE_KEY, JSON.stringify(stored))
}

export function readComputedVars(): ColorValues {
  const styles = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    COLOR_INPUTS.map(({ name }) => [name, parseCSSValue(styles.getPropertyValue(name))])
  ) as ColorValues
}

export function applyColorVarOverrides(values: ColorValues) {
  for (const { name, decimals } of COLOR_INPUTS) {
    document.documentElement.style.setProperty(name, formatValue(values[name], decimals))
  }
}

export function clearColorVarOverrides() {
  for (const { name } of COLOR_INPUTS) {
    document.documentElement.style.removeProperty(name)
  }
}
