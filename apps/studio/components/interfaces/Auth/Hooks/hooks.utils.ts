import { ident, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'

import { Hook } from './hooks.constants'

export const isHttpHookUrl = (uri: string) =>
  uri.startsWith('http://') || uri.startsWith('https://')

export const extractMethod = (
  uri: string,
  secret?: string
):
  | { type: 'postgres'; schema: string; functionName: string }
  | { type: 'http'; url: string; secret: string } => {
  if (isHttpHookUrl(uri)) {
    return { type: 'http', url: uri, secret: secret || '' }
  } else {
    const [_proto, _x, _db, schema, functionName] = (uri || '').split('/')

    return {
      type: 'postgres',
      schema: schema || '',
      functionName: functionName || '',
    }
  }
}

export const isValidHook = (h: Hook) => {
  return (
    (h.method.type === 'postgres' &&
      h.method.schema.length > 0 &&
      h.method.functionName.length > 0) ||
    (h.method.type === 'http' && isHttpHookUrl(h.method.url) && h.method.secret.length > 0)
  )
}

/**
 *
 * @param schema the schema that the function belongs to
 * @param functionName the function name associated with the hook
 * @returns an array of SQL statements to restore the original permissions to the function
 */
export const getRevokePermissionStatements = (
  schema: string,
  functionName: string
): Array<SafeSqlFragment> => {
  return [
    safeSql`-- Revoke access to function from supabase_auth_admin
revoke execute on function ${ident(schema)}.${ident(functionName)} from supabase_auth_admin;`,
    safeSql`-- Revoke access to schema from supabase_auth_admin
revoke usage on schema ${ident(schema)} from supabase_auth_admin;`,
    safeSql`-- Restore function permissions to authenticated, anon and public
grant execute on function ${ident(schema)}.${ident(functionName)} to authenticated, anon, public;`,
  ]
}
