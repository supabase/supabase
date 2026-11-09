/**
 * Parses a Postgres `rolconfig` array literal (e.g. `{search_path=public,pgrst.db_schemas=public,custom}`)
 * and returns the schemas set via `pgrst.db_schemas` on the role, if present.
 *
 * `ALTER ROLE authenticator SET pgrst.db_schemas = '...'` overrides the Dashboard's "Exposed
 * schemas" setting at the PostgREST level, so this is used to detect that override.
 */
export function getAuthenticatorDbSchemasOverride(rolconfig: string[] | null): string[] | null {
  if (!rolconfig) return null

  for (const entry of rolconfig) {
    const separatorIndex = entry.indexOf('=')
    if (separatorIndex === -1) continue

    const key = entry.slice(0, separatorIndex).trim()
    if (key !== 'pgrst.db_schemas') continue

    const value = entry.slice(separatorIndex + 1).trim()
    return value
      .split(',')
      .map((schema) => schema.trim())
      .filter(Boolean)
  }

  return null
}
