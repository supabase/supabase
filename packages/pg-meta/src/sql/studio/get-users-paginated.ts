interface getPaginatedUsersSQLProps {
  page?: number
  verified?: 'verified' | 'unverified' | 'anonymous'
  keywords?: string
  providers?: string[]
  sort: string
  order: 'asc' | 'desc'
  limit?: number

  /** If set, uses fast queries but these don't allow any sorting so the above parameters are completely ignored. */
  column?: 'id' | 'email' | 'phone'
  startAt?: string
}

const DEFAULT_LIMIT = 50

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

function stringRange(prefix: string) {
  if (!prefix) {
    return [prefix, undefined]
  }

  const lastChar = prefix.charCodeAt(prefix.length - 1)

  if (lastChar >= `~`.charCodeAt(0)) {
    // not ASCII
    return [prefix, prefix]
  }

  return [prefix, prefix.substring(0, prefix.length - 1) + String.fromCharCode(lastChar + 1)]
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
}: getPaginatedUsersSQLProps) => {
  // IMPORTANT: DO NOT CHANGE THESE QUERIES EVEN IN THE SLIGHTEST WITHOUT CONSULTING WITH AUTH TEAM.
  const offset = page * limit
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

  let actualQuery = `${conditions.length > 0 ? ` where ${combinedConditions}` : ''}
    order by
      "${sortOn}" ${sortOrder} nulls last
    limit
      ${limit}
    offset
      ${offset}
  `

  // DON'T TOUCH THESE QUERIES. ONE CHARACTER OFF AND DISASTER.
  let firstOperator = startAt ? '>' : '>='

  if (column === 'email') {
    const range = stringRange(keywords ?? '')

    actualQuery = `where lower(email) ${firstOperator} '${startAt ? startAt : range[0]}' ${range[1] ? `and lower(email) < '${range[1]}'` : ''} and instance_id = '00000000-0000-0000-0000-000000000000'::uuid order by instance_id, lower(email) asc limit ${limit}`
  } else if (column === 'phone') {
    const range = stringRange(keywords ?? '')

    actualQuery = `where phone ${firstOperator} '${startAt ? startAt : range[0]}' ${range[1] ? `and phone < '${range[1]}'` : ''} order by phone asc limit ${limit}`
  } else if (column === 'id') {
    const isMatchingUUIDValue = prefixToUUID(keywords ?? '', false) === keywords
    if (isMatchingUUIDValue) {
      actualQuery = `where id = '${keywords}' order by id asc limit ${limit}`
    } else {
      actualQuery = `where id ${firstOperator} '${startAt ? startAt : prefixToUUID(keywords ?? '', false)}' and id < '${prefixToUUID(keywords ?? '', true)}' order by id asc limit ${limit}`
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
    ${actualQuery}`

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
