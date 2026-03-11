import type { ConnectionStringPooler } from './Connect.types'
import type { ConnectionStringMethod } from './Connect.constants'

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
  connectionStringPooler: ConnectionStringPooler
}) => {
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
    return {
      host: parsed.hostname || 'hidden',
      port: parsed.port || DEFAULT_PORT,
      user: parsed.username || 'hidden',
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

export const buildConnectionParameters = (params: ConnectionParams) => [
  { key: 'host', value: params.host },
  { key: 'port', value: params.port },
  { key: 'database', value: params.database },
  { key: 'user', value: params.user },
]
