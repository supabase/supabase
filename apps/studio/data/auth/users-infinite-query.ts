import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { authKeys } from './keys'

export type Filter = 'verified' | 'unverified' | 'anonymous'

export type UsersVariables = {
  projectRef?: string
  connectionString?: string | null
  page?: number
  keywords?: string
  filter?: Filter
  providers?: string[]
  sort?: 'created_at' | 'email' | 'phone' | 'last_sign_in_at'
  order?: 'asc' | 'desc'
}

export const USERS_PAGE_LIMIT = 50
export type User = components['schemas']['UserBody'] & {
  providers: readonly string[]
}

export const getUsersSQL = ({
  page = 0,
  verified,
  keywords,
  providers,
  sort,
  order,
}: {
  page: number
  verified?: Filter
  keywords?: string
  providers?: string[]
  sort: string
  order: 'asc' | 'desc'
}) => {
  const offset = page * USERS_PAGE_LIMIT
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: string[] = []

  if (hasValidKeywords) {
    // [Joshen] Escape single quotes properly
    const formattedKeywords = keywords.replaceAll("'", "''")
    conditions.push(
      `id::text like '%${formattedKeywords}%' or email like '%${formattedKeywords}%' or phone like '%${formattedKeywords}%' or raw_user_meta_data->>'full_name' ilike '%${formattedKeywords}%' or raw_user_meta_data->>'first_name' ilike '%${formattedKeywords}%' or raw_user_meta_data->>'last_name' ilike '%${formattedKeywords}%' or raw_user_meta_data->>'display_name' ilike '%${formattedKeywords}%'`
    )
  }

  if (verified === 'verified') {
    conditions.push(`email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL`)
  } else if (verified === 'anonymous') {
    conditions.push(`is_anonymous is true`)
  } else if (verified === 'unverified') {
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
  const sortOn = sort ?? 'created_at'
  const sortOrder = order ?? 'desc'

  const usersQuery = `
with
  users_data as (
    select
      id,
      email,
      banned_until,
      created_at,
      confirmed_at,
      confirmation_sent_at,
      is_anonymous,
      is_sso_user,
      invited_at,
      last_sign_in_at,
      phone,
      raw_app_meta_data,
      raw_user_meta_data,
      updated_at
    from
      auth.users
    ${conditions.length > 0 ? ` where ${combinedConditions}` : ''}
    order by
      "${sortOn}" ${sortOrder} nulls last
    limit
      ${USERS_PAGE_LIMIT}
    offset
      ${offset}
  )
select
  *,
  coalesce(
    (
      select
        array_agg(distinct i.provider)
      from
        auth.identities i
      where
        i.user_id = users_data.id
    ),
    '{}'::text[]
  ) as providers
from
  users_data;
  `.trim()

  return usersQuery
}

export type UsersData = { result: User[] }
export type UsersError = ExecuteSqlError

export const useUsersInfiniteQuery = <TData = UsersData>(
  { projectRef, connectionString, keywords, filter, providers, sort, order }: UsersVariables,
  { enabled = true, ...options }: UseInfiniteQueryOptions<UsersData, UsersError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useInfiniteQuery<UsersData, UsersError, TData>(
    authKeys.usersInfinite(projectRef, { keywords, filter, providers, sort, order }),
    ({ signal, pageParam }) => {
      return executeSql(
        {
          projectRef,
          connectionString,
          sql: getUsersSQL({
            page: pageParam,
            verified: filter,
            keywords,
            providers,
            sort: sort ?? 'created_at',
            order: order ?? 'desc',
          }),
          queryKey: authKeys.usersInfinite(projectRef),
        },
        signal
      )
    },
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const hasNextPage = lastPage.result.length >= USERS_PAGE_LIMIT
        if (!hasNextPage) return undefined
        return page
      },
      ...options,
    }
  )
}
