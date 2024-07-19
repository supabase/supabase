import type { PoolingConfiguration } from 'data/database/pooling-configuration-query'

export const getConnectionStrings = (
  connectionInfo: {
    db_user: string
    db_port: number
    db_host: string
    db_name: string
  },
  poolingInfo: PoolingConfiguration,
  metadata: {
    usePoolerConnection: boolean
    projectRef?: string
    pgVersion?: string
  }
) => {
  const isMd5 = poolingInfo.connectionString.includes('options=reference')
  const { usePoolerConnection, projectRef } = metadata

  const user = usePoolerConnection ? poolingInfo.db_user : connectionInfo.db_user
  const port = usePoolerConnection ? poolingInfo?.db_port : connectionInfo.db_port
  const host = usePoolerConnection ? poolingInfo.db_host : connectionInfo.db_host
  const name = usePoolerConnection ? poolingInfo?.db_name : connectionInfo.db_name
  const password = '[YOUR-PASSWORD]'
  const showOptions = usePoolerConnection && isMd5

  const uriConnString = usePoolerConnection
    ? poolingInfo?.connectionString
    : `postgresql://${user}:${password}@` + `${host}:${port}` + `/${name}`
  const golangConnString = `user=${user} password=${password} host=${host} port=${port} dbname=${name}${showOptions ? ` options=reference=${projectRef}` : ''}`
  const psqlConnString = isMd5
    ? `psql "postgresql://${user}:${password}@${host}:${port}/${name}${usePoolerConnection ? `?options=reference%3D${projectRef}` : ''}"`
    : `psql -h ${host} -p ` + `${port} -d ${name} ` + `-U ${user}`
  const jdbcConnString = `jdbc:postgresql://${host}:${port}/${name}?user=${user}&password=${password}${showOptions ? `&options=reference%3D${projectRef}` : ''}`
  const dotNetConnString = `User Id=${user};Password=${password};Server=${host};Port=${port};Database=${name};${showOptions ? `Options='reference=${projectRef}'` : ''}`

  return {
    psql: psqlConnString,
    uri: uriConnString,
    golang: golangConnString,
    jdbc: jdbcConnString,
    dotnet: dotNetConnString,
    nodejs: uriConnString,
    php: golangConnString,
    python: golangConnString,
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
