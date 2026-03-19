import {
  PLATFORM_ENV_VARS,
  isPlatformVar,
  isPlatformVarSecret,
} from '@supabase-dx/env-vars'
import { configPathToEnvVar, isEnvVarBinding, parseEnvVarBinding } from '@supabase-dx/config'

// Re-export for convenience
export { PLATFORM_ENV_VARS, isPlatformVar, isPlatformVarSecret }
export { configPathToEnvVar, isEnvVarBinding, parseEnvVarBinding }

/**
 * Mapping from auth config keys (as used by the GoTrueConfig API) to canonical
 * env var names. Derived from the platform env vars registry.
 *
 * Auth config keys like EXTERNAL_GOOGLE_CLIENT_ID map to
 * SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID via the config path
 * auth.external.google.client_id.
 */
export const AUTH_CONFIG_ENV_VAR_MAP: Record<
  string,
  { envName: string; isSecret: boolean }
> = Object.fromEntries(
  Object.entries(PLATFORM_ENV_VARS)
    .filter(([_, meta]) => meta.configPath.startsWith('auth.'))
    .map(([envName, meta]) => {
      // Convert config path to the GoTrueConfig key format
      // e.g. auth.external.google.client_id → EXTERNAL_GOOGLE_CLIENT_ID
      // e.g. auth.email.smtp.host → SMTP_HOST
      const authConfigKey = meta.configPath
        .replace(/^auth\./, '')          // strip auth. prefix
        .replace(/^external\./, 'EXTERNAL_') // external.google.x → EXTERNAL_google.x
        .replace(/^email\.smtp\./, 'SMTP_')  // email.smtp.x → SMTP_x
        .replace(/\./g, '_')
        .toUpperCase()

      return [authConfigKey, { envName, isSecret: meta.isSecret }]
    })
)

/**
 * Mapping from PostgREST config keys to canonical environment variable names.
 */
export const POSTGREST_CONFIG_ENV_VAR_MAP: Record<
  string,
  { envName: string; isSecret: boolean; configPath: string }
> = {
  db_schema: { envName: 'SUPABASE_API_DB_SCHEMA', isSecret: false, configPath: 'api.schemas' },
  db_extra_search_path: {
    envName: 'SUPABASE_API_DB_EXTRA_SEARCH_PATH',
    isSecret: false,
    configPath: 'api.extra_search_path',
  },
  max_rows: { envName: 'SUPABASE_API_MAX_ROWS', isSecret: false, configPath: 'api.max_rows' },
}

/**
 * Reverse lookup: auth config key → canonical env var name.
 * Used by the Auth Providers form to show badges.
 */
export const AUTH_KEY_TO_ENV_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(AUTH_CONFIG_ENV_VAR_MAP).map(([key, { envName }]) => [key, envName])
)
