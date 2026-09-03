import type { ConfigValue } from './store.js'

const WRITE_ONLY_KEYS = new Set(['SMTP_PASS'])

export const REDACTED_VALUE = '********'

export function isRedactedWriteOnlyValue(key: string, value: unknown): boolean {
  return WRITE_ONLY_KEYS.has(key) && value === REDACTED_VALUE
}

export function redactWriteOnlyKeys(
  config: Record<string, ConfigValue>
): Record<string, ConfigValue> {
  const out = { ...config }
  for (const key of WRITE_ONLY_KEYS) {
    if (typeof out[key] === 'string' && out[key] !== '') out[key] = REDACTED_VALUE
  }
  return out
}
