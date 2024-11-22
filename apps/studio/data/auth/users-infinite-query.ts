import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { authKeys } from './keys'

export type Filter = 'verified' | 'unverified' | 'anonymous'

export type UsersVariables = {
  projectRef?: string
  connectionString?: string
  page?: number
  keywords?: string
  filter?: Filter
  providers?: string[]
  sort?: 'created_at' | 'email' | 'phone' | 'last_sign_in_at'
  order?: 'asc' | 'desc'
}

export const USERS_PAGE_LIMIT = 50
export type User = components['schemas']['UserBody']

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
  const baseQueryUsers = `select * from auth.users`

  if (hasValidKeywords) {
    conditions.push(
      `id::text ilike '%${keywords}%' or email ilike '%${keywords}%' or phone ilike '%${keywords}%'`
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

  return `${baseQueryUsers}${conditions.length > 0 ? ` where ${combinedConditions}` : ''} order by "${sortOn}" ${sortOrder} nulls last limit ${USERS_PAGE_LIMIT} offset ${offset};`
}

export type UsersData = { result: User[] }
export type UsersError = ExecuteSqlError

export const useUsersInfiniteQuery = <TData = UsersData>(
  { projectRef, connectionString, keywords, filter, providers, sort, order }: UsersVariables,
  { enabled = true, ...options }: UseInfiniteQueryOptions<UsersData, UsersError, TData> = {}
) => {
  const project = useSelectedProject()
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
        const hasNextPage = lastPage.result.length <= USERS_PAGE_LIMIT
        if (!hasNextPage) return undefined
        return page
      },
      ...options,
    }
  )
}
