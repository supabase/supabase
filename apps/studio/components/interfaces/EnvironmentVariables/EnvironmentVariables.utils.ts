import { AUTH_KEY_TO_ENV_NAME } from './EnvironmentVariables.constants'
import type { EnvironmentVariable } from './EnvironmentVariables.types'

/**
 * Given an auth config field name (e.g. EXTERNAL_GOOGLE_CLIENT_ID) and the
 * full list of env vars, returns the secrets that back that field.
 */
export function getSecretsForAuthField(
  fieldName: string,
  envVars: EnvironmentVariable[]
): EnvironmentVariable[] {
  const envVarName = AUTH_KEY_TO_ENV_NAME[fieldName]
  if (!envVarName) return []
  return envVars.filter((v) => v.name === envVarName)
}
