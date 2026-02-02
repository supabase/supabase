import { useMemo } from 'react'
import { CodeBlock } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  type ConnectionStringMethod,
  type DatabaseConnectionType,
} from '../../../Connect.constants'
import type { StepContentProps } from '../../../Connect.types'
import { ConnectionParameters } from '../../../ConnectionParameters'
import {
  PASSWORD_PLACEHOLDER,
  buildConnectionParameters,
  buildSafeConnectionString,
  parseConnectionParams,
  resolveConnectionString,
} from '../../../ConnectionString.utils'

const buildPsqlCommand = (params: { host: string; port: string; database: string; user: string }) =>
  `psql -h ${params.host} -p ${params.port} -d ${params.database} -U ${params.user}`

const buildJdbcString = (params: { host: string; port: string; database: string; user: string }) =>
  `jdbc:postgresql://${params.host}:${params.port}/${params.database}?user=${params.user}&password=${PASSWORD_PLACEHOLDER}`

/**
 * Step component for direct database connections.
 * Uses state to determine which connection string to show.
 */
function DirectConnectionContent({ state, connectionStringPooler }: StepContentProps) {
  const connectionType = (state.connectionType as DatabaseConnectionType) ?? 'uri'
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const useSharedPooler = Boolean(state.useSharedPooler)

  // Determine which connection string to use
  const resolvedConnectionString = useMemo(
    () =>
      resolveConnectionString({
        connectionMethod,
        useSharedPooler,
        connectionStringPooler,
      }),
    [connectionMethod, useSharedPooler, connectionStringPooler]
  )

  const connectionParams = useMemo(
    () => parseConnectionParams(resolvedConnectionString),
    [resolvedConnectionString]
  )

  const safeConnectionString = useMemo(
    () => buildSafeConnectionString(resolvedConnectionString, connectionParams),
    [resolvedConnectionString, connectionParams]
  )

  const connectionString = useMemo(() => {
    switch (connectionType) {
      case 'psql':
        return buildPsqlCommand(connectionParams)
      case 'jdbc':
        return buildJdbcString(connectionParams)
      case 'php':
        return `DATABASE_URL=${safeConnectionString}`
      case 'uri':
      default:
        return safeConnectionString
    }
  }, [connectionType, connectionParams, safeConnectionString])

  if (!resolvedConnectionString) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <CodeBlock
        className="[&_code]:text-foreground"
        wrapperClassName="lg:col-span-2"
        value={connectionString}
        hideLineNumbers
        language="bash"
      >
        {connectionString}
      </CodeBlock>
      <ConnectionParameters parameters={buildConnectionParameters(connectionParams)} />
    </div>
  )
}

export default DirectConnectionContent
