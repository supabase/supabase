import { Hook } from './hooks.constants'

export const extractMethod = (
  uri: string,
  secret?: string
):
  | { type: 'postgres'; schema: string; functionName: string }
  | { type: 'https'; url: string; secret: string } => {
  if (uri.startsWith('https')) {
    return { type: 'https', url: uri, secret: secret || '' }
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
    (h.method.type === 'https' && h.method.url.startsWith('https') && h.method.secret.length > 0)
  )
}

/**
 *
 * @param schema the schema that the function belongs to
 * @param functionName the function name associated with the hook
 * @returns an array of SQL statements to restore the original permissions to the function
 */
export const getRevokePermissionStatements = (schema: string, functionName: string): string[] => {
  return [
    `-- Revoke access to function from supabase_auth_admin\nrevoke execute on function ${schema}.${functionName} from supabase_auth_admin;`,
    `-- Revoke access to schema from supabase_auth_admin\nrevoke usage on schema ${schema} from supabase_auth_admin;`,
    `-- Restore function permissions to authenticated, anon and public\ngrant execute on function ${schema}.${functionName} to authenticated, anon, public;`,
  ]
}
