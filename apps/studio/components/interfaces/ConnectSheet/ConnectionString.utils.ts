import type { ConnectionStringMethod } from './Connect.constants'
import type { ConnectionStringPooler } from './Connect.types'

export const DEFAULT_PORT = '5432'
export const PASSWORD_PLACEHOLDER = '[YOUR-PASSWORD]'

export type ConnectionParams = {
  host: string
  port: string
  user: string
  database: string
}

export const resolveConnectionString = ({
  connectionMethod,
  useSharedPooler,
  connectionStringPooler,
}: {
  connectionMethod: ConnectionStringMethod
  useSharedPooler: boolean
  connectionStringPooler: ConnectionStringPooler | undefined
}) => {
  if (!connectionStringPooler) return ''

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
    }
  } catch (error) {
    return {
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
    }
  }
}

export const buildSafeConnectionString = (
  connectionString: string,
  params: ConnectionParams
): string => {
  if (!connectionString) return ''

  const search = (() => {
    try {
      return new URL(connectionString).search
    } catch (error) {
      return ''
    }
  })()

  return `postgresql://${params.user}:${PASSWORD_PLACEHOLDER}@${params.host}:${params.port}/${params.database}${search}`
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

export const buildConnectionParameters = (params: ConnectionParams) => [
  { key: 'host', value: params.host },
  { key: 'port', value: params.port },
  { key: 'database', value: params.database },
  { key: 'user', value: params.user },
]
