import { safeSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { getAuthenticatorDbSchemasOverride } from './authenticator-role-config-query.utils'
import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError } from '@/types'

export type AuthenticatorRoleConfigVariables = {
  projectRef?: string
  connectionString?: string | null
}

const getAuthenticatorRoleConfigSql = safeSql`
  select rolconfig from pg_roles where rolname = 'authenticator'
`

export async function getAuthenticatorRoleConfig(
  { projectRef, connectionString }: AuthenticatorRoleConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: getAuthenticatorRoleConfigSql,
      queryKey: ['authenticator-role-config'],
    },
    signal
  )

  const rolconfig = (result[0] as { rolconfig: string[] | null } | undefined)?.rolconfig ?? null

  return getAuthenticatorDbSchemasOverride(rolconfig)
}

export type AuthenticatorRoleConfigData = Awaited<ReturnType<typeof getAuthenticatorRoleConfig>>
export type AuthenticatorRoleConfigError = ResponseError

export const authenticatorRoleConfigQueryOptions = ({
  projectRef,
  connectionString,
}: AuthenticatorRoleConfigVariables) =>
  queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: databaseKeys.authenticatorRoleConfig(projectRef),
    queryFn: ({ signal }) => getAuthenticatorRoleConfig({ projectRef, connectionString }, signal),
    // The fix for this override is usually applied outside the Dashboard (SQL editor, another
    // client), so there's no cache-invalidation event to react to. Always refetch on mount and
    // window focus so navigating back to this page (or back to this browser tab) picks up a fix
    // immediately, instead of silently serving a stale cached result.
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    enabled: typeof projectRef !== 'undefined',
  })
