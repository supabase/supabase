import { AUTH_CONFIG_KEYS, type ConfigValueType } from './auth-config-keys.js'
import type { ConfigValue } from './store.js'

const BASELINE_ENV_PREFIX = 'AUTH_DEFAULT_'

function parseBaselineValue(type: ConfigValueType, raw: string): ConfigValue | undefined {
  switch (type) {
    case 'boolean':
      if (raw === 'true') return true
      if (raw === 'false') return false
      return undefined
    case 'number': {
      const parsed = Number(raw)
      return raw.trim() !== '' && Number.isFinite(parsed) ? parsed : undefined
    }
    case 'string':
      return raw
  }
}

export function baselineConfigFrom(
  source: Record<string, string | undefined>
): Record<string, ConfigValue> {
  const out: Record<string, ConfigValue> = {}
  for (const [key, type] of Object.entries(AUTH_CONFIG_KEYS)) {
    const raw = source[`${BASELINE_ENV_PREFIX}${key}`]
    if (raw === undefined) continue
    const value = parseBaselineValue(type, raw)
    if (value !== undefined) out[key] = value
  }
  return out
}

export function baselineConfig(): Record<string, ConfigValue> {
  return baselineConfigFrom(process.env)
}
