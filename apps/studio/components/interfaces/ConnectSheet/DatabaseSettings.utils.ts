import type { ConnectionStringPooler, DeploymentMode } from './Connect.types'

type ConnectionStrings = {
  psql: string
  uri: string
  golang: string
  jdbc: string
  dotnet: string
  nodejs: string
  php: string
  python: string
  sqlalchemy: string
}

/**
 * Self-hosted Supavisor pooler strings. User/password are placeholders that
 * the operator fills in — `POOLER_TENANT_ID` and the postgres password are
 * defined in the docker-compose env.
 */
export const getSelfHostedPoolerStrings = (
  dbHost: string,
  port: number | string,
  dbName: string = 'postgres'
): ConnectionStrings => {
  const user = 'postgres.[POOLER_TENANT_ID]'
  const password = '[YOUR-PASSWORD]'

  const uri = `postgresql://${user}:${password}@${dbHost}:${port}/${dbName}`
  const psql = `psql 'postgresql://${user}:${password}@${dbHost}:${port}/${dbName}'`
  const golang = `user=${user}\npassword=${password}\nhost=${dbHost}\nport=${port}\ndbname=${dbName}`
  const jdbc = `jdbc:postgresql://${dbHost}:${port}/${dbName}?user=${user}&password=${password}`
  const dotnet = `{
  "ConnectionStrings": {
    "DefaultConnection": "User Id=${user};Password=${password};Server=${dbHost};Port=${port};Database=${dbName}"
  }
}`
  const nodejs = `DATABASE_URL=${uri}`

  return {
    psql,
    uri,
    golang,
    jdbc,
    dotnet,
    nodejs,
    php: golang,
    python: golang,
    sqlalchemy: golang,
  }
}

/**
 * Self-hosted direct postgres connection strings. Requires the operator to
 * have exposed postgres on the host — by default docker-compose does not.
 */
export const getSelfHostedDirectStrings = (
  dbHost: string,
  port: number | string,
  dbName: string = 'postgres'
): ConnectionStrings => {
  const user = 'postgres'
  const password = '[YOUR-PASSWORD]'

  const uri = `postgresql://${user}:${password}@${dbHost}:${port}/${dbName}`
  const psql = `psql 'postgresql://${user}:${password}@${dbHost}:${port}/${dbName}'`
  const golang = `user=${user}\npassword=${password}\nhost=${dbHost}\nport=${port}\ndbname=${dbName}`
  const jdbc = `jdbc:postgresql://${dbHost}:${port}/${dbName}?user=${user}&password=${password}`
  const dotnet = `{
  "ConnectionStrings": {
    "DefaultConnection": "User Id=${user};Password=${password};Server=${dbHost};Port=${port};Database=${dbName}"
  }
}`
  const nodejs = `DATABASE_URL=${uri}`

  return {
    psql,
    uri,
    golang,
    jdbc,
    dotnet,
    nodejs,
    php: golang,
    python: golang,
    sqlalchemy: golang,
  }
}

/**
 * Returns `{ direct, pooler }`. `.direct` depends only on `connectionInfo`, so
 * when callers invoke this twice (once per pooler flavor) as
 * `connectionStringsShared` / `connectionStringsDedicated`, both `.direct`
 * fields are identical — the `Shared`/`Dedicated` suffix only describes which
 * pooler URI you get from `.pooler`.
 */
export const getConnectionStrings = ({
  connectionInfo,
  poolingInfo,
  metadata,
}: {
  connectionInfo: {
    db_user: string
    db_port: number
    db_host: string
    db_name: string
  }
  poolingInfo?: {
    connectionString: string
    db_user: string
    db_port: number
    db_host: string
    db_name: string
  }
  metadata: {
    projectRef?: string
    pgVersion?: string
  }
}): {
  direct: ConnectionStrings
  pooler: ConnectionStrings
} => {
  const isMd5 = poolingInfo?.connectionString.includes('options=reference')
  const { projectRef } = metadata
  const password = '[YOUR-PASSWORD]'

  // Direct connection variables
  const directUser = connectionInfo.db_user
  const directPort = connectionInfo.db_port
  const directHost = connectionInfo.db_host
  const directName = connectionInfo.db_name

  // Pooler connection variables
  const poolerUser = poolingInfo?.db_user
  const poolerPort = poolingInfo?.db_port
  const poolerHost = poolingInfo?.db_host
  const poolerName = poolingInfo?.db_name

  // Direct connection strings
  const directPsqlString = isMd5
    ? `psql "postgresql://${directUser}:${password}@${directHost}:${directPort}/${directName}"`
    : `psql -h ${directHost} -p ${directPort} -d ${directName} -U ${directUser}`

  const directUriString = `postgresql://${directUser}:${password}@${directHost}:${directPort}/${directName}`

  const directGolangString = `DATABASE_URL=${directUriString}`

  const directJdbcString = `jdbc:postgresql://${directHost}:${directPort}/${directName}?user=${directUser}&password=${password}`

  // User Id=${directUser};Password=${password};Server=${directHost};Port=${directPort};Database=${directName}`
  const directDotNetString = `{
  "ConnectionStrings": {
    "DefaultConnection": "Host=${directHost};Database=${directName};Username=${directUser};Password=${password};SSL Mode=Require;Trust Server Certificate=true"
  }
}`

  // `User Id=${poolerUser};Password=${password};Server=${poolerHost};Port=${poolerPort};Database=${poolerName}${isMd5 ? `;Options='reference=${projectRef}'` : ''}`
  const poolerDotNetString = `{
  "ConnectionStrings": {
    "DefaultConnection": "User Id=${poolerUser};Password=${password};Server=${poolerHost};Port=${poolerPort};Database=${poolerName}${isMd5 ? `;Options='reference=${projectRef}'` : ''}"
  }
}`

  const directNodejsString = `DATABASE_URL=${directUriString}`

  // Pooler connection strings
  const poolerPsqlString = isMd5
    ? `psql "postgresql://${poolerUser}:${password}@${poolerHost}:${poolerPort}/${poolerName}?options=reference%3D${projectRef}"`
    : `psql -h ${poolerHost} -p ${poolerPort} -d ${poolerName} -U ${poolerUser}`

  const poolerUriString = poolingInfo?.connectionString ?? ''

  const nodejsPoolerUriString = `DATABASE_URL=${poolingInfo?.connectionString ?? ''}`

  const poolerGolangString = `user=${poolerUser} 
password=${password} 
host=${poolerHost}
port=${poolerPort}
dbname=${poolerName}${isMd5 ? `options=reference=${projectRef}` : ''}`

  const poolerJdbcString = `jdbc:postgresql://${poolerHost}:${poolerPort}/${poolerName}?user=${poolerUser}${isMd5 ? `&options=reference%3D${projectRef}` : ''}&password=${password}`

  const sqlalchemyString = `user=${directUser} 
password=${password} 
host=${directHost} 
port=${directPort} 
dbname=${directName}`

  const poolerSqlalchemyString = `user=${poolerUser} 
password=${password} 
host=${poolerHost} 
port=${poolerPort} 
dbname=${poolerName}`

  return {
    direct: {
      psql: directPsqlString,
      uri: directUriString,
      golang: directGolangString,
      jdbc: directJdbcString,
      dotnet: directDotNetString,
      nodejs: directNodejsString,
      php: directGolangString,
      python: directGolangString,
      sqlalchemy: sqlalchemyString,
    },
    pooler: {
      psql: poolerPsqlString,
      uri: poolerUriString,
      golang: poolerGolangString,
      jdbc: poolerJdbcString,
      dotnet: poolerDotNetString,
      nodejs: nodejsPoolerUriString,
      php: poolerGolangString,
      python: poolerGolangString,
      sqlalchemy: poolerSqlalchemyString,
    },
  }
}

/**
 * Shapes the ConnectionStringPooler "bag" consumed by every connection-string
 * step. On platform we keep the existing shared/dedicated pooler layout; on
 * self-hosted we substitute Supavisor placeholder strings on the standard
 * ports; on CLI we collapse to direct since no pooler is exposed.
 */
export const buildConnectionStringPooler = ({
  deploymentMode,
  connectionInfo,
  connectionStringsShared,
  connectionStringsDedicated,
  ipv4Addon,
}: {
  deploymentMode: DeploymentMode
  connectionInfo: { db_host: string; db_port: number | string }
  connectionStringsShared: { direct: ConnectionStrings; pooler: ConnectionStrings }
  connectionStringsDedicated?: { direct: ConnectionStrings; pooler: ConnectionStrings }
  ipv4Addon: boolean
}): ConnectionStringPooler => {
  if (deploymentMode.isSelfHosted) {
    const dbHost = connectionInfo.db_host
    const dbPort = connectionInfo.db_port || 5432
    const sessionPool = getSelfHostedPoolerStrings(dbHost, dbPort)
    const transactionPool = getSelfHostedPoolerStrings(dbHost, 6543)
    const directConn = getSelfHostedDirectStrings(dbHost, dbPort)
    return {
      transactionShared: transactionPool.uri,
      sessionShared: sessionPool.uri,
      transactionDedicated: undefined,
      sessionDedicated: undefined,
      ipv4SupportedForDedicatedPooler: false,
      direct: directConn.uri,
    }
  }

  if (deploymentMode.isCli) {
    // CLI exposes postgres directly; no pooler is available, so any code path
    // that reaches for a pooler URI falls back to the direct connection.
    const directUri = connectionStringsShared.direct.uri
    return {
      transactionShared: directUri,
      sessionShared: directUri,
      transactionDedicated: undefined,
      sessionDedicated: undefined,
      ipv4SupportedForDedicatedPooler: false,
      direct: directUri,
    }
  }

  // Port-swap 6543→5432 derives session from transaction. For shared this is a
  // real Supavisor session connection; for dedicated it lands on direct Postgres
  // (PgBouncer has no session mode).
  return {
    transactionShared: connectionStringsShared.pooler.uri,
    sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
    transactionDedicated: connectionStringsDedicated?.pooler.uri,
    sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
    ipv4SupportedForDedicatedPooler: ipv4Addon,
    direct: connectionStringsShared.direct.uri,
  }
}
