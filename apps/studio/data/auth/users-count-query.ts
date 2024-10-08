import { UseQueryOptions } from '@tanstack/react-query'

import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { Filter } from './users-infinite-query'
import { authKeys } from './keys'

type UsersCountVariables = {
  projectRef?: string
  connectionString?: string
  keywords?: string
  filter?: Filter
  providers?: string[]
}

const getUsersCountSQl = ({
  verified,
  keywords,
  providers,
}: {
  verified?: Filter
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

  return `${baseQueryCount}${conditions.length > 0 ? ` where ${combinedConditions}` : ''};`
}

export type UsersCountData = { result: [{ count: number }] }
export type UsersCountError = ExecuteSqlError

export const useUsersCountQuery = <TData extends UsersCountData = UsersCountData>(
  { projectRef, connectionString, keywords, filter, providers }: UsersCountVariables,
  options: UseQueryOptions<ExecuteSqlData, UsersCountError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getUsersCountSQl({ keywords, verified: filter, providers }),
      queryKey: authKeys.usersCount(projectRef, { keywords, filter, providers }),
    },
    options
  )
