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
