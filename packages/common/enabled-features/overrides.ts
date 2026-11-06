import enabledFeaturesRaw from './enabled-features.json' with { type: 'json' }

const knownFeatureKeys = Object.keys(enabledFeaturesRaw).filter((key) => key !== '$schema')

const ENV_PREFIX = 'ENABLED_FEATURES_'

// Server-only env var that short-circuits feature resolution; handled by
// isFeatureEnabled directly, not by this parser.
const RESERVED_ENV_NAMES = new Set<string>(['ENABLED_FEATURES_OVERRIDE_DISABLE_ALL'])

function featureKeyToEnvName(feature: string): string {
  return ENV_PREFIX + feature.toUpperCase().replace(/[^A-Z0-9]/g, '_')
}

function parseBooleanEnv(raw: string): boolean | null {
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return null
}

/**
 * Returns the list of feature keys disabled by ENABLED_FEATURES_* env vars.
 * Server-only — these are not NEXT_PUBLIC_* and must be read at request time.
 * Invalid values and prefixed env vars that don't match a known feature are
 * logged and ignored.
 */
export function getEnabledFeaturesOverrideDisabledList(
  env: Record<string, string | undefined>
): string[] {
  const expected = new Map<string, string>()
  for (const key of knownFeatureKeys) {
    expected.set(featureKeyToEnvName(key), key)
  }

  const disabled: string[] = []
  for (const [envName, featureKey] of expected) {
    const raw = env[envName]
    if (raw === undefined || raw === '') continue
    const parsed = parseBooleanEnv(raw)
    if (parsed === null) {
      console.warn(
        `[enabled-features] ${envName} must be "true" or "false" (got "${raw}"); ignoring.`
      )
      continue
    }
    if (parsed === false) disabled.push(featureKey)
  }

  for (const envName of Object.keys(env)) {
    if (!envName.startsWith(ENV_PREFIX)) continue
    if (expected.has(envName)) continue
    if (RESERVED_ENV_NAMES.has(envName)) continue
    console.warn(`[enabled-features] ${envName} does not match any known feature; ignoring.`)
  }

  return disabled
}
