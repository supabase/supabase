import type { ConnectionStringMethod } from './Connect.constants'
import type { ConnectionStringPooler } from './Connect.types'

export const DEFAULT_PORT = '5432'
export const PASSWORD_PLACEHOLDER = '[YOUR-DATABASE-PASSWORD]'
export const TOKEN_PASSWORD_PLACEHOLDER = '[YOUR-ACCESS-TOKEN]'
export const TEMPORARY_ACCESS_POOLER_OPTIONS = 'options=-c%20jit%3dtrue'

/** Appends query params to a connection string, joining with `?` or `&` as needed */
export const appendConnectionStringParams = (uri: string, params: string) =>
  !uri || !params ? uri : `${uri}${uri.includes('?') ? '&' : '?'}${params}`

export type ConnectionParams = {
  host: string
  port: string
  user: string
  database: string
  /** Raw query string including the leading `?`, or '' when the URI has none */
  search: string
}

export const resolveConnectionString = ({
  connectionMethod,
  useSharedPooler,
  connectionStringPooler,
  grantRole,
}: {
  connectionMethod: ConnectionStringMethod
  useSharedPooler: boolean
  connectionStringPooler: ConnectionStringPooler | undefined
  grantRole?: string | null
}): string => {
  if (!connectionStringPooler) return ''

  if (grantRole) {
    const uri = resolveConnectionString({
      connectionMethod,
      useSharedPooler: true,
      connectionStringPooler,
    })
    return applyTemporaryAccessToConnectionString(uri, {
      role: grantRole,
      addPoolerJitOption: connectionMethod !== 'direct',
    })
  }

  if (connectionMethod === 'direct') {
    return connectionStringPooler.direct ?? ''
  }

  if (connectionMethod === 'session') {
    return connectionStringPooler.sessionShared ?? ''
  }

  if (useSharedPooler || !connectionStringPooler.transactionDedicated) {
    return connectionStringPooler.transactionShared ?? ''
  }

  return connectionStringPooler.transactionDedicated ?? ''
}

export const parseConnectionParams = (connectionString: string): ConnectionParams => {
  if (!connectionString) {
    return {
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
      search: '',
    }
  }

  try {
    const parsed = new URL(connectionString)
    // The URL parser percent-encodes characters that aren't valid in user-info
    // (e.g. brackets in the self-hosted `postgres.[POOLER_TENANT_ID]` placeholder).
    // Decode so the displayed string matches the literal we wrote.
    const decode = (value: string) => {
      try {
        return decodeURIComponent(value)
      } catch {
        return value
      }
    }
    return {
      host: parsed.hostname || 'hidden',
      port: parsed.port || DEFAULT_PORT,
      user: parsed.username ? decode(parsed.username) : 'hidden',
      database: parsed.pathname?.replace(/^\//, '') || 'hidden',
      search: parsed.search,
    }
  } catch (error) {
    return {
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
      search: '',
    }
  }
}

export const buildSafeConnectionString = (
  connectionString: string,
  params: ConnectionParams,
  passwordPlaceholder: string = PASSWORD_PLACEHOLDER
): string => {
  if (!connectionString) return ''

  return `postgresql://${params.user}:${passwordPlaceholder}@${params.host}:${params.port}/${params.database}${params.search}`
}

export const buildPsqlCommand = (params: ConnectionParams) =>
  params.search
    ? // Query params (e.g. sslmode) can't be expressed as psql flags, so fall
      // back to the URI form — psql prompts for the password.
      `psql "postgresql://${params.user}@${params.host}:${params.port}/${params.database}${params.search}"`
    : `psql -h ${params.host} -p ${params.port} -d ${params.database} -U ${params.user}`

export const buildJdbcString = (
  params: ConnectionParams,
  passwordPlaceholder: string = PASSWORD_PLACEHOLDER
) => {
  // pgJDBC (42.7.4+) spells libpq's `sslnegotiation` as `sslNegotiation`
  const extraParams = params.search
    ? `&${params.search.slice(1).replace('sslnegotiation=', 'sslNegotiation=')}`
    : ''
  return `jdbc:postgresql://${params.host}:${params.port}/${params.database}?user=${params.user}&password=${passwordPlaceholder}${extraParams}`
}

/**
 * Ensures a connection string's query params carry `sslmode=require` without
 * dropping params the URI already has (e.g. `options=reference%3D...` or
 * `sslnegotiation=direct`).
 */
export const withRequiredSslmode = (search: string) => {
  if (!search) return '?sslmode=require'
  if (search.includes('sslmode=')) return search
  return `${search}&sslmode=require`
}

export const buildDotnetConnectionString = (
  params: ConnectionParams,
  passwordPlaceholder = PASSWORD_PLACEHOLDER
) => {
  // Multigres only accepts direct SSL negotiation; Npgsql (9+) spells it
  // `SSL Negotiation=Direct` and throws on the parameter in older versions,
  // so only emit it when the resolved URI carries the param.
  const poolerOptions = new URLSearchParams(params.search).get('options')
  const options =
    passwordPlaceholder === TOKEN_PASSWORD_PLACEHOLDER && poolerOptions
      ? `;Options=${poolerOptions}`
      : ''
  const sslNegotiation = params.search.includes('sslnegotiation=direct')
    ? ';SSL Negotiation=Direct'
    : ''
  return `Host=${params.host};Port=${params.port};Database=${params.database};Username=${params.user};Password=${passwordPlaceholder};SSL Mode=Require;Trust Server Certificate=true${sslNegotiation}${options}`
}

export const buildConnectionStringWithPassword = (
  connectionString: string,
  password: string
): string => {
  if (!connectionString || !password) return connectionString

  const encodedPassword = (() => {
    try {
      return encodeURIComponent(password)
    } catch {
      return password
    }
  })()

  return connectionString.split(PASSWORD_PLACEHOLDER).join(encodedPassword)
}

export const buildConnectionParameters = (params: ConnectionParams, tokenPassword?: string) => [
  { key: 'host', value: params.host },
  { key: 'port', value: params.port },
  { key: 'database', value: params.database },
  { key: 'user', value: params.user },
  ...(tokenPassword
    ? [
        { key: 'password', value: tokenPassword },
        ...Array.from(new URLSearchParams(params.search), ([key, value]) => ({ key, value })),
      ]
    : []),
]

/**
 * Replaces the Postgres role in a connection username, keeping any pooler
 * suffix (`postgres.projref` → `{role}.projref`).
 */
export const replaceConnectionUser = (user: string, role: string): string => {
  if (!user || !role) return user
  const suffixIndex = user.indexOf('.')
  if (suffixIndex === -1) return role
  return `${role}${user.slice(suffixIndex)}`
}

const replaceUserInConnectionString = (uri: string, role: string): string => {
  const match = uri.match(/^(postgres(?:ql)?:\/\/)([^:/@]+)(:[^@]*)?@/)
  if (!match) return uri

  const [, protocol, rawUser, passwordPart = ''] = match
  let user = rawUser
  try {
    user = decodeURIComponent(rawUser)
  } catch {
    // Keep the raw username when it is not valid percent-encoding.
  }

  return `${protocol}${replaceConnectionUser(user, role)}${passwordPart}@${uri.slice(match[0].length)}`
}

const hasTemporaryAccessPoolerOption = (uri: string) =>
  uri.includes('jit%3dtrue') || uri.includes('jit=true')

export const applyTemporaryAccessToConnectionString = (
  uri: string,
  {
    role,
    addPoolerJitOption = false,
  }: {
    role: string
    addPoolerJitOption?: boolean
  }
): string => {
  if (!uri || !role) return uri

  const withRole = replaceUserInConnectionString(uri, role)
  const withToken = withRole.split(PASSWORD_PLACEHOLDER).join(TOKEN_PASSWORD_PLACEHOLDER)

  if (!addPoolerJitOption || hasTemporaryAccessPoolerOption(withToken)) {
    return withToken
  }

  return appendConnectionStringParams(withToken, TEMPORARY_ACCESS_POOLER_OPTIONS)
}

export const applyTemporaryAccessToPooler = (
  pooler: ConnectionStringPooler,
  role: string
): ConnectionStringPooler => {
  const rewrite = (uri: string | undefined, addPoolerJitOption: boolean) =>
    uri ? applyTemporaryAccessToConnectionString(uri, { role, addPoolerJitOption }) : uri

  return {
    ...pooler,
    direct: rewrite(pooler.direct, false),
    transactionShared: applyTemporaryAccessToConnectionString(pooler.transactionShared, {
      role,
      addPoolerJitOption: true,
    }),
    sessionShared: applyTemporaryAccessToConnectionString(pooler.sessionShared, {
      role,
      addPoolerJitOption: true,
    }),
    transactionDedicated: undefined,
    sessionDedicated: undefined,
  }
}
