import { ident, literal } from '@supabase/pg-meta/src/pg-format'

import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT } from '../table-rows/table-rows.sql'

function prefixToUUID(prefix: string, max: boolean) {
  const mapped = '00000000-0000-0000-0000-000000000000'
    .split('')
    .map((c, i) => (c === '-' ? c : prefix[i] ?? c))

  if (prefix.length >= mapped.length) {
    return mapped.join('')
  }

  if (prefix.length && prefix.length < 15) {
    mapped[14] = '4'
  }

  if (prefix.length && prefix.length < 20) {
    mapped[19] = max ? 'b' : '8'
  }

  if (max) {
    for (let i = prefix.length; i < mapped.length; i += 1) {
      if (mapped[i] === '0') {
        mapped[i] = 'f'
      }
    }
  }

  return mapped.join('')
}

function stringRange(prefix: string): [string, string | undefined] {
  if (!prefix) {
    return [prefix, undefined]
  }

  const lastCharCode = prefix.charCodeAt(prefix.length - 1)
  const TILDE_CHAR_CODE = 126 // '~'
  const Z_CHAR_CODE = 122 // 'z'

  // 'z' (122): append '~' to avoid PostgreSQL collation issues with '{'
  if (lastCharCode === Z_CHAR_CODE) {
    return [prefix, prefix + '~']
  }

  // '~' (126) or beyond: append space since we can't increment further
  if (lastCharCode >= TILDE_CHAR_CODE) {
    return [prefix, prefix + ' ']
  }

  // All other characters: increment the last character
  const upperBound = prefix.substring(0, prefix.length - 1) + String.fromCharCode(lastCharCode + 1)
  return [prefix, upperBound]
}

export type OptimizedSearchColumns = 'id' | 'email' | 'phone' | 'name'

export const USER_SEARCH_INDEXES = [
  'idx_users_email',
  'idx_users_created_at_desc',
  'idx_users_last_sign_in_at_desc',
  'idx_users_name',
  // this index is not created by the indexworker but is required for efficient queries
  // it is already created as part of the `UNIQUE` constraint on the `phone` column
  'users_phone_key',
]

export const getUserSQL = (userId: string) => {
  const sql = /* SQL */ `
select
  auth.users.id,
  auth.users.email,
  auth.users.banned_until,
  auth.users.created_at,
  auth.users.confirmed_at,
  auth.users.confirmation_sent_at,
  auth.users.is_anonymous,
  auth.users.is_sso_user,
  auth.users.invited_at,
  auth.users.last_sign_in_at,
  auth.users.phone,
  auth.users.raw_app_meta_data,
  auth.users.raw_user_meta_data,
  auth.users.updated_at,
  coalesce(
    (
      select
        array_agg(distinct i.provider)
      from
        auth.identities i
      where
        i.user_id = users.id
    ),
    '{}'::text[]
  ) as providers
from
  auth.users
where id = '${userId}';
`.trim()

  return sql
}

export const getIndexStatusesSQL = () => {
  return `SELECT c.relname as index_name, i.indisvalid as is_valid, i.indisready as is_ready
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
    AND c.relname IN (${USER_SEARCH_INDEXES.map(literal).join(', ')});`
}

// Checks pg_locks to determine if the index worker advisory lock is currently held
export const getIndexWorkerStatusSQL = () => {
  return `SELECT EXISTS (
    SELECT 1 FROM pg_locks
    WHERE locktype = 'advisory'
    AND (classid::bigint << 32 | objid::bigint) = hashtext('auth_index_worker')::bigint
  ) as is_in_progress;`
}

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
    if (column === 'email') {
      const range = stringRange(keywords)
      const lowerBound = literal(range[0])
      const upperBound = range[1] ? literal(range[1]) : null
      conditions.push(
        `lower(email) >= ${lowerBound}${upperBound ? ` and lower(email) < ${upperBound}` : ''} and instance_id = '00000000-0000-0000-0000-000000000000'::uuid`
      )
    } else if (column === 'phone') {
      const range = stringRange(keywords)
      const lowerBound = literal(range[0])
      const upperBound = range[1] ? literal(range[1]) : null
      conditions.push(`phone >= ${lowerBound}${upperBound ? ` and phone < ${upperBound}` : ''}`)
    } else if (column === 'id') {
      const lowerUUID = prefixToUUID(keywords, false)
      const isMatchingUUIDValue = lowerUUID === keywords
      if (isMatchingUUIDValue) {
        conditions.push(`id = ${literal(keywords)}`)
      } else {
        const upperUUID = prefixToUUID(keywords, true)
        conditions.push(`id >= ${literal(lowerUUID)} and id < ${literal(upperUUID)}`)
      }
    }
  } else {
    // Unified search mode - apply all filters
    if (hasValidKeywords) {
      const escapedFilterKeywords = literal(`%${keywords}%`)
      conditions.push(
        `id::text ilike ${escapedFilterKeywords} or email ilike ${escapedFilterKeywords} or phone ilike ${escapedFilterKeywords}`
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
        const mappedProviders = providers.map((p) => (p === 'saml 2.0' ? 'sso' : p))
        conditions.push(
          `(select jsonb_agg(case when value ~ '^sso' then 'sso' else value end) from jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${literal(mappedProviders)}]`.trim()
        )
      } else {
        conditions.push(`(raw_app_meta_data->>'providers')::jsonb ?| array[${literal(providers)}]`)
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

    const escapedSelectSql = literal(selectBaseSql)

    const sql = `
${COUNT_ESTIMATE_SQL}

with approximation as (${USERS_COUNT_ESTIMATE_SQL})
select 
  case 
    when estimate = -1 then (select pg_temp.count_estimate(${escapedSelectSql}))::int
    when estimate > ${THRESHOLD_COUNT} then ${conditions.length > 0 ? `(select pg_temp.count_estimate(${escapedSelectSql}))::int` : 'estimate::int'}
    else (${countBaseSql})
  end as count,
  estimate = -1 or estimate > ${THRESHOLD_COUNT} as is_estimate
from approximation;
`.trim()

    return sql
  }
}

const DEFAULT_LIMIT = 50

export interface UsersCursor {
  sort: string
  id: string
}

interface getPaginatedUsersSQLProps {
  page?: number
  verified?: 'verified' | 'unverified' | 'anonymous'
  keywords?: string
  providers?: string[]
  sort: string
  order: 'asc' | 'desc'
  limit?: number

  /** If set, uses fast queries but these don't allow any sorting so the above parameters are completely ignored. */
  column?: OptimizedSearchColumns
  startAt?: string

  /** Cursor for cursor-based pagination (used by improved search) */
  cursor?: UsersCursor
  improvedSearchEnabled?: boolean
}

export const getPaginatedUsersSQL = ({
  page = 0,
  verified,
  keywords,
  providers,
  sort,
  order,
  limit = DEFAULT_LIMIT,

  column,
  startAt,
  cursor,

  improvedSearchEnabled = false,
}: getPaginatedUsersSQLProps) => {
  if (improvedSearchEnabled) {
    return getImprovedPaginatedUsersSQL({
      column: column ?? 'email',
      keywords,
      verified,
      providers,
      sort,
      order,
      limit,
      cursor,
    })
  }

  // IMPORTANT: DO NOT CHANGE THESE QUERIES EVEN IN THE SLIGHTEST WITHOUT CONSULTING WITH AUTH TEAM.
  const offset = page * limit
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: string[] = []

  if (hasValidKeywords) {
    const pattern = `%${keywords}%`
    conditions.push(
      `id::text like ${literal(pattern)} or email like ${literal(pattern)} or phone like ${literal(pattern)} or raw_user_meta_data->>'full_name' ilike ${literal(pattern)} or raw_user_meta_data->>'first_name' ilike ${literal(pattern)} or raw_user_meta_data->>'last_name' ilike ${literal(pattern)} or raw_user_meta_data->>'display_name' ilike ${literal(pattern)}`
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
        `(select jsonb_agg(case when value ~ '^sso' then 'sso' else value end) from jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${providers.map((p) => literal(p === 'saml 2.0' ? 'sso' : p)).join(', ')}]`.trim()
      )
    } else {
      conditions.push(
        `(raw_app_meta_data->>'providers')::jsonb ?| array[${providers.map((p) => literal(p)).join(', ')}]`
      )
    }
  }

  const combinedConditions = conditions.map((x) => `(${x})`).join(' and ')
  const sortOn = sort ?? 'created_at'
  const sortOrder = order ?? 'desc'

  let whereStatement = `${conditions.length > 0 ? ` where ${combinedConditions}` : ''}
    order by
      ${ident(sortOn)} ${sortOrder} nulls last
    limit
      ${limit}
    offset
      ${offset}
  `

  // DON'T TOUCH THESE QUERIES. ONE CHARACTER OFF AND DISASTER.
  const firstOperator = startAt ? '>' : '>='

  if (column === 'email') {
    const range = stringRange(keywords ?? '')

    whereStatement = `where lower(email) ${firstOperator} ${literal(startAt ? startAt : range[0])} ${range[1] ? `and lower(email) < ${literal(range[1])}` : ''} and instance_id = '00000000-0000-0000-0000-000000000000'::uuid order by instance_id, lower(email) asc limit ${limit}`
  } else if (column === 'phone') {
    const range = stringRange(keywords ?? '')
    whereStatement = `where phone ${firstOperator} ${literal(startAt ? startAt : range[0])} ${range[1] ? `and phone < ${literal(range[1])}` : ''} order by phone asc limit ${limit}`
  } else if (column === 'id') {
    const isMatchingUUIDValue = prefixToUUID(keywords ?? '', false) === keywords
    if (isMatchingUUIDValue) {
      whereStatement = `where id = ${literal(keywords)} order by id asc limit ${limit}`
    } else {
      whereStatement = `where id ${firstOperator} ${literal(startAt ? startAt : prefixToUUID(keywords ?? '', false))} and id < ${literal(prefixToUUID(keywords ?? '', true))} order by id asc limit ${limit}`
    }
  }

  let usersData = `
    select
      auth.users.id,
      auth.users.email,
      auth.users.banned_until,
      auth.users.created_at,
      auth.users.confirmed_at,
      auth.users.confirmation_sent_at,
      auth.users.is_anonymous,
      auth.users.is_sso_user,
      auth.users.invited_at,
      auth.users.last_sign_in_at,
      auth.users.phone,
      auth.users.raw_app_meta_data,
      auth.users.raw_user_meta_data,
      auth.users.updated_at
    from
      auth.users
    ${whereStatement}`

  let usersQuery = `
with
  users_data as (${usersData})
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

/**
 * Generates SQL for improved paginated user search that leverages specific indexes.
 * Uses cursor-based pagination for efficient and consistent paging.
 *
 * Indexes leveraged:
 * - idx_users_email (btree) - for email prefix and exact match searches and sorting by email
 * - idx_users_created_at_desc - for sorting by created_at
 * - idx_users_last_sign_in_at_desc - for sorting by last_sign_in_at
 * - idx_users_name (btree) - for name prefix and exact match searches on raw_user_meta_data->>'name'
 * - users_phone_key (btree) - for phone prefix searches and sorting by phone
 */
export const getImprovedPaginatedUsersSQL = ({
  column,
  keywords,
  verified,
  providers,
  sort,
  order,
  cursor,
  limit = DEFAULT_LIMIT,
}: getPaginatedUsersSQLProps) => {
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: string[] = []

  // Column-specific search condition
  if (hasValidKeywords) {
    if (column === 'email') {
      // Use btree index with prefix matching
      const range = stringRange(keywords)
      if (range[1]) {
        conditions.push(`email >= ${literal(range[0])} AND email < ${literal(range[1])}`)
      } else {
        conditions.push(`email >= ${literal(range[0])}`)
      }
    } else if (column === 'phone') {
      // Use btree index with prefix matching
      const range = stringRange(keywords)
      if (range[1]) {
        conditions.push(`phone >= ${literal(range[0])} AND phone < ${literal(range[1])}`)
      } else {
        conditions.push(`phone >= ${literal(range[0])}`)
      }
    } else if (column === 'id') {
      // Exact match on UUID
      conditions.push(`id = ${literal(keywords)}`)
    } else if (column === 'name') {
      // Use btree index with prefix matching on raw_user_meta_data->>'name'
      const range = stringRange(keywords)
      if (range[1]) {
        conditions.push(
          `raw_user_meta_data->>'name' >= ${literal(range[0])} AND raw_user_meta_data->>'name' < ${literal(range[1])}`
        )
      } else {
        conditions.push(`raw_user_meta_data->>'name' >= ${literal(range[0])}`)
      }
    }
  }

  // Verified filter
  if (verified === 'verified') {
    conditions.push(`(email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)`)
  } else if (verified === 'anonymous') {
    conditions.push(`is_anonymous IS TRUE`)
  } else if (verified === 'unverified') {
    conditions.push(`(email_confirmed_at IS NULL AND phone_confirmed_at IS NULL)`)
  }

  // Providers filter
  if (providers && providers.length > 0) {
    if (providers.includes('saml 2.0')) {
      conditions.push(
        `(SELECT jsonb_agg(CASE WHEN value ~ '^sso' THEN 'sso' ELSE value END) FROM jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${providers.map((p) => literal(p === 'saml 2.0' ? 'sso' : p)).join(', ')}]`
      )
    } else {
      conditions.push(
        `(raw_app_meta_data->>'providers')::jsonb ?| array[${providers.map((p) => literal(p)).join(', ')}]`
      )
    }
  }

  const sortOn = sort ?? 'created_at'
  const sortOrder = order ?? 'desc'

  // Cursor-based pagination: fetch rows after the cursor position
  if (cursor) {
    const operator = sortOrder === 'desc' ? '<' : '>'
    // When sorting by id, no need for a composite cursor since id is already unique
    if (sortOn === 'id') {
      conditions.push(`id ${operator} ${literal(cursor.id)}::uuid`)
    } else {
      conditions.push(
        `(${ident(sortOn)}, id) ${operator} (${literal(cursor.sort)}, ${literal(cursor.id)}::uuid)`
      )
    }
  }

  const combinedConditions = conditions.map((x) => `(${x})`).join(' AND ')
  const whereClause = conditions.length > 0 ? `WHERE ${combinedConditions}` : ''

  // Order by sort column, with id as tie breaker (unless already sorting by id)
  const orderByClause =
    sortOn === 'id'
      ? `${ident(sortOn)} ${sortOrder}`
      : `${ident(sortOn)} ${sortOrder}, id ${sortOrder}`

  const usersData = `
    SELECT
      auth.users.id,
      auth.users.email,
      auth.users.banned_until,
      auth.users.created_at,
      auth.users.confirmed_at,
      auth.users.confirmation_sent_at,
      auth.users.is_anonymous,
      auth.users.is_sso_user,
      auth.users.invited_at,
      auth.users.last_sign_in_at,
      auth.users.phone,
      auth.users.raw_app_meta_data,
      auth.users.raw_user_meta_data
    FROM
      auth.users
    ${whereClause}
    ORDER BY
      ${orderByClause}
    LIMIT
      ${limit}`

  const usersQuery = `
WITH
  users_data AS (${usersData})
SELECT
  *,
  COALESCE(
    (
      SELECT
        array_agg(DISTINCT i.provider)
      FROM
        auth.identities i
      WHERE
        i.user_id = users_data.id
    ),
    '{}'::text[]
  ) AS providers
FROM
  users_data;`.trim()

  return usersQuery
}
