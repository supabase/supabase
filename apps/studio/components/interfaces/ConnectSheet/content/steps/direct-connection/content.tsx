import { useParams } from 'common'
import { useMemo } from 'react'
import { CodeBlock } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { getConnectionStrings } from '../../../DatabaseSettings.utils'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import {
  type ConnectionStringMethod,
  type DatabaseConnectionType,
} from '@/components/interfaces/ConnectSheet/Connect.constants'
import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'
import { ConnectionParameters } from '@/components/interfaces/ConnectSheet/ConnectionParameters'
import {
  buildConnectionParameters,
  buildSafeConnectionString,
  parseConnectionParams,
  PASSWORD_PLACEHOLDER,
  resolveConnectionString,
} from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from '@/data/database/supavisor-configuration-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { pluckObjectFields } from '@/lib/helpers'

const buildPsqlCommand = (params: { host: string; port: string; database: string; user: string }) =>
  `psql -h ${params.host} -p ${params.port} -d ${params.database} -U ${params.user}`

const buildJdbcString = (params: { host: string; port: string; database: string; user: string }) =>
  `jdbc:postgresql://${params.host}:${params.port}/${params.database}?user=${params.user}&password=${PASSWORD_PLACEHOLDER}`

/**
 * [Joshen] ConnectStepsSection does something similar but since only this page needs to consider connection strings
 * from all databases (including read replicas), am opting to separate the logic for retrieving connection strings here
 *
 * We can however, consider to shift this logic into ConnectStepsSection, such that we can consider read replicas for
 * the other tabs like "Framework" and "ORM" too. However, leaving them out for now and only updating "Direct"
 */
const useConnectionStringDatabases = () => {
  const { ref: projectRef } = useParams()
  const { hasAccess: allowPgBouncerSelection } = useCheckEntitlements('dedicated_pooler')

  const { data: databases = [] } = useReadReplicasQuery({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }

  return Object.fromEntries(
    databases.map((db) => {
      const connectionInfo = pluckObjectFields(db || emptyState, DB_FIELDS)
      const poolingConfigurationShared = supavisorConfig?.find(
        (x) => x.identifier === db.identifier
      )
      const poolingConfigurationDedicated = allowPgBouncerSelection ? pgbouncerConfig : undefined

      const connectionStringsShared = getConnectionStrings({
        connectionInfo,
        poolingInfo: {
          connectionString: poolingConfigurationShared?.connection_string ?? '',
          db_host: poolingConfigurationShared?.db_host ?? '',
          db_name: poolingConfigurationShared?.db_name ?? '',
          db_port: poolingConfigurationShared?.db_port ?? 0,
          db_user: poolingConfigurationShared?.db_user ?? '',
        },
        metadata: { projectRef: db.identifier },
      })

      const connectionStringsDedicated =
        poolingConfigurationDedicated !== undefined
          ? getConnectionStrings({
              connectionInfo,
              poolingInfo: {
                connectionString: poolingConfigurationDedicated.connection_string.replace(
                  projectRef ?? '_',
                  db.identifier
                ),
                db_host: poolingConfigurationDedicated.db_host,
                db_name: poolingConfigurationDedicated.db_name,
                db_port: poolingConfigurationDedicated.db_port,
                db_user: poolingConfigurationDedicated.db_user,
              },
              metadata: { projectRef: db.identifier },
            })
          : undefined

      return [
        db.identifier,
        {
          transactionShared: connectionStringsShared.pooler.uri,
          sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
          transactionDedicated: connectionStringsDedicated?.pooler.uri,
          sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
          ipv4SupportedForDedicatedPooler: !!ipv4Addon,
          direct: connectionStringsShared.direct.uri,
        },
      ]
    })
  )
}

/**
 * Step component for direct database connections.
 * Uses state to determine which connection string to show.
 */
function DirectConnectionContent({ state }: StepContentProps) {
  const connectionSource = state.connectionSource
  const connectionType = (state.connectionType as DatabaseConnectionType) ?? 'uri'
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const useSharedPooler = Boolean(state.useSharedPooler)

  const connectionStrings = useConnectionStringDatabases()
  const connectionStringPooler =
    connectionStrings[connectionSource as keyof typeof connectionStrings]

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
