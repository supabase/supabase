import { PoolingConfiguration } from 'data/database/pooling-configuration-query'

export const getHostFromConnectionString = (str: string) => {
  const segment = str.split('[YOUR-PASSWORD]@')
  const [output] = segment[1].split(':')
  return output
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
    usePoolerConnection: boolean
    projectRef?: string
    pgVersion?: string
  }
) => {
  const { usePoolerConnection, projectRef } = metadata

  // Pooler: user, host port
  const user = usePoolerConnection ? `postgres.${projectRef}` : connectionInfo.db_user
  const port = usePoolerConnection ? poolingInfo?.db_port : connectionInfo.db_port
  // [Joshen] Temp FE: extract host from pooler connection string
  const host = usePoolerConnection
    ? getHostFromConnectionString(poolingInfo.connectionString)
    : connectionInfo.db_host
  const name = usePoolerConnection ? poolingInfo?.db_name : connectionInfo.db_name

  const uriConnString = usePoolerConnection
    ? poolingInfo?.connectionString
    : `postgresql://${user}:[YOUR-PASSWORD]@` + `${host}:${port}` + `/${name}`
  const golangConnString =
    `user=${user} password=[YOUR-PASSWORD] ` + `host=${host} port=${port}` + ` dbname=${name}`
  const psqlConnString = `psql -h ${host} -p ` + `${port} -d ${name} ` + `-U ${user}`
  const jdbcConnString =
    `jdbc:postgresql://${host}:${port}` + `/${name}?user=${user}&password=[YOUR-PASSWORD]`
  const dotNetConnString =
    `User Id=${user};Password=[YOUR-PASSWORD];` +
    `Server=${host};Port=${port};` +
    `Database=${name}`
  const pythonConnString =
    `user=${user} password=[YOUR-PASSWORD]` + ` host=${host} port=${port}` + ` database=${name}`

  return {
    psql: psqlConnString,
    uri: uriConnString,
    golang: golangConnString,
    jdbc: jdbcConnString,
    dotnet: dotNetConnString,
    nodejs: uriConnString,
    php: golangConnString,
    python: pythonConnString,
  }
}

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
  const isMd5 = connString.includes('?options=reference')
  const poolerHostDetails = [
    { value: cloudProvider.toLocaleLowerCase(), tooltip: 'Cloud provider' },
    { value: '-0-', tooltip: undefined },
    { value: region, tooltip: "Project's region" },
    { value: `.pooler.supabase.${tld}`, tooltip: undefined },
  ]
  const dbHostDetails = [
    { value: 'db.', tooltip: undefined },
    { value: ref, tooltip: "Project's reference ID" },
    { value: `.supabase.${tld}`, tooltip: undefined },
  ]

  if (selectedTab === 'uri' || selectedTab === 'nodejs') {
    if (isMd5) {
      return [
        { value: 'postgres://', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        { value: ':', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: '@', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: `?options=reference%3D`, tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'postgres://', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
        { value: ':', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: '@', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
      ]
    }
  }

  if (selectedTab === 'psql') {
    if (isMd5) {
      return [
        { value: 'psql "postgresql://', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        { value: ':', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: '@', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: '?options=reference%3D', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'psql -h ', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ' -p ', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: ' -d ', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        { value: ' -U ', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
      ]
    }
  }

  if (selectedTab === 'golang' || selectedTab === 'php' || selectedTab === 'python') {
    if (isMd5) {
      return [
        { value: 'user=', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        { value: ' password=', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: ' host=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ' port=', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: ' dbname=', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: ' options=reference=', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'user=', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
        { value: ' password=', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: ' host=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ' port=', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: ' dbname=', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
      ]
    }
  }

  if (selectedTab === 'jdbc') {
    if (isMd5) {
      return [
        { value: 'jdbc:postgresql://', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ':', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        { value: '?user=', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        { value: '&password=', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        ...(usePoolerConnection
          ? [
              { value: '&options=reference%3D', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'jdbc:postgresql://', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: `:`, tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: '/', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        { value: '?user=', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
        { value: '&password=', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
      ]
    }
  }

  if (selectedTab === 'dotnet') {
    if (isMd5) {
      return [
        { value: 'User Id=', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        { value: ';Password=', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: ';Server=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ';Port=', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: ';Database=', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: ";Options='reference=", tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
              { value: "'", tooltip: undefined },
            ]
          : []),
      ]
    } else {
      return [
        { value: 'User Id=', tooltip: undefined },
        { value: '[user]', tooltip: 'Database user (e.g postgres)' },
        ...(usePoolerConnection
          ? [
              { value: '.', tooltip: undefined },
              { value: ref, tooltip: "Project's reference ID" },
            ]
          : []),
        { value: ';Password=', tooltip: undefined },
        { value: '[password]', tooltip: 'Database password' },
        { value: ';Server=', tooltip: undefined },
        ...(usePoolerConnection ? poolerHostDetails : dbHostDetails),
        { value: ';Port=', tooltip: undefined },
        { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
        { value: ';Database=', tooltip: undefined },
        { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
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
