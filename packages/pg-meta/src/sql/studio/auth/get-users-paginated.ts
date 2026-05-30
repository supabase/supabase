import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '../../../pg-format'
import { prefixToUUID, stringRange } from './get-users-common'
import { OptimizedSearchColumns } from './get-users-types'

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

const DEFAULT_LIMIT = 50

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
}: getPaginatedUsersSQLProps): SafeSqlFragment => {
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

  const conditions: SafeSqlFragment[] = []

  if (hasValidKeywords) {
    const pattern = `%${keywords}%`
    conditions.push(
      safeSql`id::text like ${literal(pattern)} or email like ${literal(pattern)} or phone like ${literal(pattern)} or raw_user_meta_data->>'full_name' ilike ${literal(pattern)} or raw_user_meta_data->>'first_name' ilike ${literal(pattern)} or raw_user_meta_data->>'last_name' ilike ${literal(pattern)} or raw_user_meta_data->>'display_name' ilike ${literal(pattern)}`
    )
  }

  if (verified === 'verified') {
    conditions.push(safeSql`email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL`)
  } else if (verified === 'anonymous') {
    conditions.push(safeSql`is_anonymous is true`)
  } else if (verified === 'unverified') {
    conditions.push(safeSql`email_confirmed_at IS NULL AND phone_confirmed_at IS NULL`)
  }

  if (providers && providers.length > 0) {
    // [Joshen] This is arguarbly not fully optimized, but at the same time not commonly used
    // JFYI in case we do eventually run into performance issues here when filtering for SAML provider
    if (providers.includes('saml 2.0')) {
      conditions.push(
        safeSql`(select jsonb_agg(case when value ~ '^sso' then 'sso' else value end) from jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${joinSqlFragments(
          providers.map((p) => literal(p === 'saml 2.0' ? 'sso' : p)),
          ', '
        )}]`
      )
    } else {
      conditions.push(
        safeSql`(raw_app_meta_data->>'providers')::jsonb ?| array[${joinSqlFragments(
          providers.map((p) => literal(p)),
          ', '
        )}]`
      )
    }
  }

  const combinedConditions = joinSqlFragments(
    conditions.map((x) => safeSql`(${x})`),
    ' and '
  )
  const sortOn = keyword(sort) ?? safeSql`created_at`
  const sortOrder = keyword(order) ?? safeSql`desc`

  let whereStatement = safeSql`${conditions.length > 0 ? safeSql` where ${combinedConditions}` : safeSql``}
    order by
      ${ident(sortOn)} ${sortOrder} nulls last
    limit
      ${literal(limit)}
    offset
      ${literal(offset)}
  `

  // DON'T TOUCH THESE QUERIES. ONE CHARACTER OFF AND DISASTER.
  const firstOperator = startAt ? safeSql`>` : safeSql`>=`

  if (column === 'email') {
    const range = stringRange(keywords ?? '')

    whereStatement = safeSql`where lower(email) ${firstOperator} ${literal(startAt ? startAt : range[0])} ${range[1] ? safeSql`and lower(email) < ${literal(range[1])}` : safeSql``} and instance_id = '00000000-0000-0000-0000-000000000000'::uuid order by instance_id, lower(email) asc limit ${literal(limit)}`
  } else if (column === 'phone') {
    const range = stringRange(keywords ?? '')
    whereStatement = safeSql`where phone ${firstOperator} ${literal(startAt ? startAt : range[0])} ${range[1] ? safeSql`and phone < ${literal(range[1])}` : safeSql``} order by phone asc limit ${literal(limit)}`
  } else if (column === 'id') {
    const isMatchingUUIDValue = prefixToUUID(keywords ?? '', false) === keywords
    if (isMatchingUUIDValue) {
      whereStatement = safeSql`where id = ${literal(keywords)} order by id asc limit ${literal(limit)}`
    } else {
      whereStatement = safeSql`where id ${firstOperator} ${literal(startAt ? startAt : prefixToUUID(keywords ?? '', false))} and id < ${literal(prefixToUUID(keywords ?? '', true))} order by id asc limit ${literal(limit)}`
    }
  }

  let usersData = safeSql`
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

  let usersQuery = safeSql`with
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
  users_data;`

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
}: getPaginatedUsersSQLProps): SafeSqlFragment => {
  const hasValidKeywords = keywords && keywords !== ''

  const conditions: SafeSqlFragment[] = []

  // Column-specific search condition
  if (hasValidKeywords) {
    if (column === 'email') {
      // Use btree index with prefix matching
      const range = stringRange(keywords)
      if (range[1]) {
        conditions.push(safeSql`email >= ${literal(range[0])} AND email < ${literal(range[1])}`)
      } else {
        conditions.push(safeSql`email >= ${literal(range[0])}`)
      }
    } else if (column === 'phone') {
      // Use btree index with prefix matching
      const range = stringRange(keywords)
      if (range[1]) {
        conditions.push(safeSql`phone >= ${literal(range[0])} AND phone < ${literal(range[1])}`)
      } else {
        conditions.push(safeSql`phone >= ${literal(range[0])}`)
      }
    } else if (column === 'id') {
      // Exact match on UUID
      conditions.push(safeSql`id = ${literal(keywords)}`)
    } else if (column === 'name') {
      // Use btree index with prefix matching on raw_user_meta_data->>'name'
      const range = stringRange(keywords)
      if (range[1]) {
        conditions.push(
          safeSql`raw_user_meta_data->>'name' >= ${literal(range[0])} AND raw_user_meta_data->>'name' < ${literal(range[1])}`
        )
      } else {
        conditions.push(safeSql`raw_user_meta_data->>'name' >= ${literal(range[0])}`)
      }
    }
  }

  // Verified filter
  if (verified === 'verified') {
    conditions.push(safeSql`(email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)`)
  } else if (verified === 'anonymous') {
    conditions.push(safeSql`is_anonymous IS TRUE`)
  } else if (verified === 'unverified') {
    conditions.push(safeSql`(email_confirmed_at IS NULL AND phone_confirmed_at IS NULL)`)
  }

  // Providers filter
  if (providers && providers.length > 0) {
    if (providers.includes('saml 2.0')) {
      conditions.push(
        safeSql`(SELECT jsonb_agg(CASE WHEN value ~ '^sso' THEN 'sso' ELSE value END) FROM jsonb_array_elements_text((raw_app_meta_data ->> 'providers')::jsonb)) ?| array[${joinSqlFragments(
          providers.map((p) => literal(p === 'saml 2.0' ? 'sso' : p)),
          ', '
        )}]`
      )
    } else {
      conditions.push(
        safeSql`(raw_app_meta_data->>'providers')::jsonb ?| array[${joinSqlFragments(
          providers.map((p) => literal(p)),
          ', '
        )}]`
      )
    }
  }

  const sortOn = keyword(sort) ?? safeSql`created_at`
  const sortOrder = keyword(order) ?? safeSql`desc`

  // Cursor-based pagination: fetch rows after the cursor position
  if (cursor) {
    const operator = sortOrder === 'desc' ? safeSql`<` : safeSql`>`
    // When sorting by id, no need for a composite cursor since id is already unique
    if (sortOn === 'id') {
      conditions.push(safeSql`id ${operator} ${literal(cursor.id)}::uuid`)
    } else {
      conditions.push(
        safeSql`(${ident(sortOn)}, id) ${operator} (${literal(cursor.sort)}, ${literal(cursor.id)}::uuid)`
      )
    }
  }

  const combinedConditions = joinSqlFragments(
    conditions.map((x) => safeSql`(${x})`),
    ' AND '
  )
  const whereClause = conditions.length > 0 ? safeSql`WHERE ${combinedConditions}` : safeSql``

  // Order by sort column, with id as tie breaker (unless already sorting by id)
  const orderByClause =
    sortOn === 'id'
      ? safeSql`${ident(sortOn)} ${sortOrder}`
      : safeSql`${ident(sortOn)} ${sortOrder}, id ${sortOrder}`

  const usersData = safeSql`
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
      ${literal(limit)}`

  const usersQuery = safeSql`WITH
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
  users_data;`

  return usersQuery
}
