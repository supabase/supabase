import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT } from '../database/get-count-estimate'
import { prefixToUUID, stringRange } from './get-users-common'
import type { OptimizedSearchColumns } from './get-users-types'

export const USERS_COUNT_ESTIMATE_SQL = safeSql`select reltuples as estimate from pg_class where oid = 'auth.users'::regclass`

export const getUsersCountSQL = ({
  filter,
  keywords,
  providers,
  forceExactCount = false,
  column,
}: {
  filter?: 'verified' | 'unverified' | 'anonymous'
  keywords?: string
  providers?: string[]
  forceExactCount?: boolean
  /** If set, uses optimized prefix search for the specified column */
  column?: OptimizedSearchColumns
}): SafeSqlFragment => {
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: SafeSqlFragment[] = []
  const baseQueryCount = safeSql`select count(*) from auth.users`
  const baseQuerySelect = safeSql`select * from auth.users`

  const optimizedSearchMode = column && hasValidKeywords
  if (optimizedSearchMode) {
    if (column === 'email') {
      const range = stringRange(keywords)
      const lowerBound = literal(range[0])
      const upperBound = range[1] ? literal(range[1]) : null
      conditions.push(
        safeSql`lower(email) >= ${lowerBound}${upperBound ? safeSql` and lower(email) < ${upperBound}` : safeSql``} and instance_id = '00000000-0000-0000-0000-000000000000'::uuid`
      )
    } else if (column === 'phone') {
      const range = stringRange(keywords)
      const lowerBound = literal(range[0])
      const upperBound = range[1] ? literal(range[1]) : null
      conditions.push(
        safeSql`phone >= ${lowerBound}${upperBound ? safeSql` and phone < ${upperBound}` : safeSql``}`
      )
    } else if (column === 'id') {
      const lowerUUID = prefixToUUID(keywords, false)
      const isMatchingUUIDValue = lowerUUID === keywords
      if (isMatchingUUIDValue) {
        conditions.push(safeSql`id = ${literal(keywords)}`)
      } else {
        const upperUUID = prefixToUUID(keywords, true)
        conditions.push(safeSql`id >= ${literal(lowerUUID)} and id < ${literal(upperUUID)}`)
      }
    }
  } else {
    // Unified search mode - apply all filters
    if (hasValidKeywords) {
      const escapedFilterKeywords = literal(`%${keywords}%`)
      conditions.push(
        safeSql`id::text ilike ${escapedFilterKeywords} or email ilike ${escapedFilterKeywords} or phone ilike ${escapedFilterKeywords}`
      )
    }

    if (filter === 'verified') {
      conditions.push(safeSql`email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL`)
    } else if (filter === 'anonymous') {
      conditions.push(safeSql`is_anonymous is true`)
    } else if (filter === 'unverified') {
      conditions.push(safeSql`email_confirmed_at IS NULL AND phone_confirmed_at IS NULL`)
    }

    if (providers && providers.length > 0) {
      // [Joshen] This is arguarbly not fully optimized, but at the same time not commonly used
      // JFYI in case we do eventually run into performance issues here when filtering for SAML provider
      if (providers.includes('saml 2.0')) {
        const mappedProviders = providers.map((p) => (p === 'saml 2.0' ? 'sso' : p))
        conditions.push(
          safeSql`(select jsonb_agg(case when value ~ '^sso' then 'sso' else value end) from jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${literal(mappedProviders)}]`
        )
      } else {
        conditions.push(
          safeSql`(raw_app_meta_data->>'providers')::jsonb ?| array[${literal(providers)}]`
        )
      }
    }
  }

  const combinedConditions = joinSqlFragments(
    conditions.map((x) => safeSql`(${x})`),
    ' and '
  )
  const whereClause = conditions.length > 0 ? safeSql` where ${combinedConditions}` : safeSql``

  if (forceExactCount) {
    return safeSql`select (${baseQueryCount}${whereClause}), false as is_estimate;`
  } else {
    const selectBaseSql = safeSql`${baseQuerySelect}${whereClause}`
    const countBaseSql = safeSql`${baseQueryCount}${whereClause}`

    const escapedSelectSql = literal(selectBaseSql)

    const sql = safeSql`${COUNT_ESTIMATE_SQL}

with approximation as (${USERS_COUNT_ESTIMATE_SQL})
select 
  case 
    when estimate = -1 then (select pg_temp.count_estimate(${escapedSelectSql}))::int
    when estimate > ${literal(THRESHOLD_COUNT)} then ${conditions.length > 0 ? safeSql`(select pg_temp.count_estimate(${escapedSelectSql}))::int` : safeSql`estimate::int`}
    else (${countBaseSql})
  end as count,
  estimate = -1 or estimate > ${literal(THRESHOLD_COUNT)} as is_estimate
from approximation`

    return sql
  }
}
