export const getConnectionStrings = (connectionInfo: {
  db_user: string
  db_port: number
  db_host: string
  db_name: string
}) => {
  const uriConnString =
    `postgresql://${connectionInfo.db_user}:[YOUR-PASSWORD]@` +
    `${connectionInfo.db_host}:${connectionInfo.db_port.toString()}` +
    `/${connectionInfo.db_name}`
  const golangConnString =
    `user=${connectionInfo.db_user} password=[YOUR-PASSWORD] ` +
    `host=${connectionInfo.db_host} port=${connectionInfo.db_port.toString()}` +
    ` dbname=${connectionInfo.db_name}`
  const psqlConnString =
    `psql -h ${connectionInfo.db_host} -p ` +
    `${connectionInfo.db_port.toString()} -d ${connectionInfo.db_name} ` +
    `-U ${connectionInfo.db_user}`
  const jdbcConnString =
    `jdbc:postgresql://${connectionInfo.db_host}:${connectionInfo.db_port.toString()}` +
    `/${connectionInfo.db_name}?user=${connectionInfo.db_user}&password=[YOUR-PASSWORD]`
  const dotNetConnString =
    `User Id=${connectionInfo.db_user};Password=[YOUR-PASSWORD];` +
    `Server=${connectionInfo.db_host};Port=${connectionInfo.db_port.toString()};` +
    `Database=${connectionInfo.db_name}`
  const pythonConnString =
    `user=${connectionInfo.db_user} password=[YOUR-PASSWORD]` +
    ` host=${connectionInfo.db_host} port=${connectionInfo.db_port.toString()}` +
    ` database=${connectionInfo.db_name}`

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
