/**
 * SQL utilities for the advisors data layer.
 * All queries go through pg-meta via executeSql — no edge functions needed.
 */

const S = '_supabase_advisors'

/**
 * Escape a value for safe interpolation into SQL.
 * Not for security (the user already has full DB access via the dashboard),
 * but for correctness — avoids syntax errors from unquoted strings.
 */
function literal(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return String(val)
  if (Array.isArray(val)) {
    if (val.length === 0) return "ARRAY[]::text[]"
    return `ARRAY[${val.map(literal).join(',')}]::text[]`
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

export { S, literal }
