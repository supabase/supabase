import type { PoolingConfiguration } from 'data/database/pooling-configuration-query'

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

export const getConnectionStrings = (
  connectionInfo: {
    db_user: string
    db_port: number
    db_host: string
    db_name: string
  },
  poolingInfo: PoolingConfiguration,
  metadata: {
    projectRef?: string
    pgVersion?: string
  }
): {
  direct: ConnectionStrings
  pooler: ConnectionStrings
} => {
  const isMd5 = poolingInfo.connectionString.includes('options=reference')
  const { projectRef } = metadata
  const password = '[YOUR-PASSWORD]'

  // Direct connection variables
  const directUser = connectionInfo.db_user
  const directPort = connectionInfo.db_port
  const directHost = connectionInfo.db_host
  const directName = connectionInfo.db_name

  // Pooler connection variables
  const poolerUser = poolingInfo.db_user
  const poolerPort = poolingInfo.db_port
  const poolerHost = poolingInfo.db_host
  const poolerName = poolingInfo.db_name

  // Direct connection strings
  const directPsqlString = isMd5
    ? `psql "postgresql://${directUser}:${password}@${directHost}:${directPort}/${directName}"`
    : `psql -h ${directHost} -p ${directPort} -d ${directName} -U ${directUser}`

  const directUriString = `postgresql://${directUser}:${password}@${directHost}:${directPort}/${directName}`

  const directGolangString = `DATABASE_URL=${poolingInfo.connectionString}`

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

  // Pooler connection strings
  const poolerPsqlString = isMd5
    ? `psql "postgresql://${poolerUser}:${password}@${poolerHost}:${poolerPort}/${poolerName}?options=reference%3D${projectRef}"`
    : `psql -h ${poolerHost} -p ${poolerPort} -d ${poolerName} -U ${poolerUser}.${projectRef}`

  const poolerUriString = poolingInfo.connectionString

  const nodejsPoolerUriString = `DATABASE_URL=${poolingInfo.connectionString}`

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
      nodejs: nodejsPoolerUriString,
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

const DB_USER_DESC = 'Database user (e.g postgres)'
const DB_PASS_DESC = 'Database password'
const DB_NAME_DESC = 'Database name (e.g postgres)'
const PROJECT_REF_DESC = "Project's reference ID"
const PORT_NUMBER_DESC = 'Port number (Use 5432 if using prepared statements)'

// [Joshen] This is to the best of interpreting the syntax from the API response
// // There's different format for PG13 (depending on authentication method being md5) and PG14
export const constructConnStringSyntax = (
  connString: string,
  {
    selectedTab,
    usePoolerConnection,
    ref,
    cloudProvider,
    region,
    tld,
    portNumber,
  }: {
    selectedTab: 'uri' | 'psql' | 'golang' | 'jdbc' | 'dotnet' | 'nodejs' | 'php' | 'python'
    usePoolerConnection: boolean
    ref: string
    cloudProvider: string
    region: string
    tld: string
    portNumber: string
  }
) => {
  const isMd5 = connString.includes('options=reference')
  const poolerHostDetails = [
    { value: cloudProvider.toLocaleLowerCase(), tooltip: 'Cloud provider' },
    { value: '-0-', tooltip: undefined },
    { value: region, tooltip: "Project's region" },
    { value: `.pooler.supabase.${tld}`, tooltip: undefined },
  ]
  const dbHostDetails = [
    { value: 'db.', tooltip: undefined },
    { value: ref, tooltip: PROJECT_REF_DESC },
    { value: `.supabase.${tld}`, tooltip: undefined },
  ]

  if (selectedTab === 'uri' || selectedTab === 'nodejs') {
    if (isMd5) {
      return [
        { value: 'postgresql://', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        { value: ':', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: '@', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        ...(usePoolerConnection
          ? [
              { value: `?options=reference%3D`, tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'postgresql://', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
        { value: ':', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: '@', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
      ]
    }
  }

  if (selectedTab === 'psql') {
    if (isMd5) {
      return [
        { value: 'psql "postgresql://', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        { value: ':', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: '@', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        ...(usePoolerConnection
          ? [
              { value: '?options=reference%3D', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'psql -h ', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ' -p ', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: ' -d ', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        { value: ' -U ', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
      ]
    }
  }

  if (selectedTab === 'golang' || selectedTab === 'php' || selectedTab === 'python') {
    if (isMd5) {
      return [
        { value: 'user=', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        { value: ' password=', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: ' host=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ' port=', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: ' dbname=', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        ...(usePoolerConnection
          ? [
              { value: ' options=reference=', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'user=', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
        { value: ' password=', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: ' host=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ' port=', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: ' dbname=', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
      ]
    }
  }

  if (selectedTab === 'jdbc') {
    if (isMd5) {
      return [
        { value: 'jdbc:postgresql://', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        { value: '?user=', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        { value: '&password=', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        ...(usePoolerConnection
          ? [
              { value: '&options=reference%3D', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'jdbc:postgresql://', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: `:`, tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        { value: '?user=', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
        { value: '&password=', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
      ]
    }
  }

  if (selectedTab === 'dotnet') {
    if (isMd5) {
      return [
        { value: 'User Id=', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        { value: ';Password=', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: ';Server=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ';Port=', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: ';Database=', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
        ...(usePoolerConnection
          ? [
              { value: ";Options='reference=", tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
              { value: "'", tooltip: undefined },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'User Id=', tooltip: undefined },
        { value: '[user]', tooltip: DB_USER_DESC },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: PROJECT_REF_DESC },
            ]
          : []),
        { value: ';Password=', tooltip: undefined },
        { value: '[password]', tooltip: DB_PASS_DESC },
        { value: ';Server=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ';Port=', tooltip: undefined },
        { value: portNumber, tooltip: PORT_NUMBER_DESC },
        { value: ';Database=', tooltip: undefined },
        { value: '[db-name]', tooltip: DB_NAME_DESC },
      ]
    }
  }

  return []
}

export const getPoolerTld = (connString: string) => {
  try {
    const segment = connString.split('pooler.supabase.')[1]
    const tld = segment.split(':6543')[0]
    return tld
  } catch {
    return 'com'
  }
}
