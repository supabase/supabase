import type { OptimizedSearchColumns } from './get-users-types'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT } from './get-count-estimate'
import { stringRange, prefixToUUID } from './get-users-common'
import { literal } from '../../pg-format'

export const USERS_COUNT_ESTIMATE_SQL = `select reltuples as estimate from pg_class where oid = 'auth.users'::regclass`

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
}) => {
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: string[] = []
  const baseQueryCount = `select count(*) from auth.users`
  const baseQuerySelect = `select * from auth.users`

  const optimizedSearchMode = column && hasValidKeywords
  if (optimizedSearchMode) {
    const formattedKeywords = keywords.replaceAll("'", "''")

    if (column === 'email') {
      const range = stringRange(formattedKeywords)
      conditions.push(
        `lower(email) >= '${range[0]}'${range[1] ? ` and lower(email) < '${range[1]}'` : ''} and instance_id = '00000000-0000-0000-0000-000000000000'::uuid`
      )
    } else if (column === 'phone') {
      const range = stringRange(formattedKeywords)
      conditions.push(`phone >= '${range[0]}'${range[1] ? ` and phone < '${range[1]}'` : ''}`)
    } else if (column === 'id') {
      const isMatchingUUIDValue = prefixToUUID(formattedKeywords, false) === formattedKeywords
      conditions.push(
        isMatchingUUIDValue
          ? `id = '${formattedKeywords}'`
          : `id >= '${prefixToUUID(formattedKeywords, false)}' and id < '${prefixToUUID(formattedKeywords, true)}'`
      )
    }
  } else {
    // Unified search mode - apply all filters
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
          `(select jsonb_agg(case when value ~ '^sso' then 'sso' else value end) from jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${literal(providers.map((p) => (p === 'saml 2.0' ? 'sso' : p)))}]`.trim()
        )
      } else {
        conditions.push(
          `(raw_app_meta_data->>'providers')::jsonb ?| array[${providers.map((p) => `'${p}'`).join(', ')}]`
        )
      }
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

with approximation as (${USERS_COUNT_ESTIMATE_SQL})
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
