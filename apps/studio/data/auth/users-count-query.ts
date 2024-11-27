import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { authKeys } from './keys'
import { Filter } from './users-infinite-query'

type UsersCountVariables = {
  projectRef?: string
  connectionString?: string
  keywords?: string
  filter?: Filter
  providers?: string[]
}

const getUsersCountSql = ({
  filter,
  keywords,
  providers,
}: {
  filter?: Filter
  keywords?: string
  providers?: string[]
}) => {
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: string[] = []
  const baseQueryCount = `select count(*) from auth.users`

  if (hasValidKeywords) {
    conditions.push(
      `id::text ilike '%${keywords}%' or email ilike '%${keywords}%' or phone ilike '%${keywords}%'`
    )
  }

  if (filter === 'verified') {
    conditions.push(`email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL`)
  } else if (filter === 'anonymous') {
    conditions.push(`is_anonymous is true`)
  } else if (filter === 'unverified') {
    conditions.push(`email_confirmed_at IS NULL AND phone_confirmed_at IS NULL`)
  }

  if (providers && providers.length > 0) {
    // [Joshen] This is arguarbly not fully optimized, but at the same time not commonly used
    // JFYI in case we do eventually run into performance issues here when filtering for SAML provider
    if (providers.includes('saml 2.0')) {
      conditions.push(
        `(select jsonb_agg(case when value ~ '^sso' then 'sso' else value end) from jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${providers.map((p) => (p === 'saml 2.0' ? `'sso'` : `'${p}'`)).join(', ')}]`.trim()
      )
    } else {
      conditions.push(
        `(raw_app_meta_data->>'providers')::jsonb ?| array[${providers.map((p) => `'${p}'`).join(', ')}]`
      )
    }
  }

  const combinedConditions = conditions.map((x) => `(${x})`).join(' and ')

  return `${baseQueryCount}${conditions.length > 0 ? ` where ${combinedConditions}` : ''};`
}

export async function getUsersCount(
  { projectRef, connectionString, keywords, filter, providers }: UsersCountVariables,
  signal?: AbortSignal
) {
  const sql = getUsersCountSql({ filter, keywords, providers })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['users-count'],
    },
    signal
  )

  const count = result?.[0]?.count

  if (typeof count !== 'number') {
    throw new Error('Error fetching users count')
  }

  return count
}

export type UsersCountData = Awaited<ReturnType<typeof getUsersCount>>
export type UsersCountError = ExecuteSqlError

export const useUsersCountQuery = <TData = UsersCountData>(
  { projectRef, connectionString, keywords, filter, providers }: UsersCountVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersCountData, UsersCountError, TData> = {}
) =>
  useQuery<UsersCountData, UsersCountError, TData>(
    authKeys.usersCount(projectRef, { keywords, filter, providers }),
    ({ signal }) =>
      getUsersCount({ projectRef, connectionString, keywords, filter, providers }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
