import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { executeSql, type ExecuteSqlError } from 'data/sql/execute-sql-query'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT } from 'data/table-rows/table-rows-count-query'
import { authKeys } from './keys'
import { type Filter } from './users-infinite-query'

type UsersCountVariables = {
  projectRef?: string
  connectionString?: string | null
  keywords?: string
  filter?: Filter
  providers?: string[]
  forceExactCount?: boolean
}

const getUsersCountSql = ({
  filter,
  keywords,
  providers,
  forceExactCount = false,
}: {
  filter?: Filter
  keywords?: string
  providers?: string[]
  forceExactCount?: boolean
}) => {
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: string[] = []
  const baseQueryCount = `select count(*) from auth.users`
  const baseQuerySelect = `select * from auth.users`

  if (hasValidKeywords) {
    // [Joshen] Escape single quotes properly
    const formattedKeywords = keywords.replaceAll("'", "''")
    conditions.push(
      `id::text ilike '%${formattedKeywords}%' or email ilike '%${formattedKeywords}%' or phone ilike '%${formattedKeywords}%'`
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
  const whereClause = conditions.length > 0 ? ` where ${combinedConditions}` : ''

  if (forceExactCount) {
    return `select (${baseQueryCount}${whereClause}), false as is_estimate;`
  } else {
    const selectBaseSql = `${baseQuerySelect}${whereClause}`
    const countBaseSql = `${baseQueryCount}${whereClause}`

    const escapedSelectSql = selectBaseSql.replaceAll("'", "''")

    const sql = `
${COUNT_ESTIMATE_SQL}

with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = 'auth.users'::regclass
)
select 
  case 
    when estimate = -1 then (select pg_temp.count_estimate('${escapedSelectSql}'))::int
    when estimate > ${THRESHOLD_COUNT} then ${conditions.length > 0 ? `(select pg_temp.count_estimate('${escapedSelectSql}'))::int` : 'estimate::int'}
    else (${countBaseSql})
  end as count,
  estimate = -1 or estimate > ${THRESHOLD_COUNT} as is_estimate
from approximation;
`.trim()

    return sql
  }
}

export async function getUsersCount(
  {
    projectRef,
    connectionString,
    keywords,
    filter,
    providers,
    forceExactCount,
  }: UsersCountVariables,
  signal?: AbortSignal
) {
  const sql = getUsersCountSql({ filter, keywords, providers, forceExactCount })

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
  const isEstimate = result?.[0]?.is_estimate

  if (typeof count !== 'number') {
    throw new Error('Error fetching users count')
  }

  return {
    count,
    is_estimate: isEstimate ?? true,
  }
}

export type UsersCountData = Awaited<ReturnType<typeof getUsersCount>>
export type UsersCountError = ExecuteSqlError

export const useUsersCountQuery = <TData = UsersCountData>(
  {
    projectRef,
    connectionString,
    keywords,
    filter,
    providers,
    forceExactCount,
  }: UsersCountVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersCountData, UsersCountError, TData> = {}
) =>
  useQuery<UsersCountData, UsersCountError, TData>(
    authKeys.usersCount(projectRef, {
      keywords,
      filter,
      providers,
      forceExactCount,
    }),
    ({ signal }) =>
      getUsersCount(
        {
          projectRef,
          connectionString,
          keywords,
          filter,
          providers,
          forceExactCount,
        },
        signal
      ),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
