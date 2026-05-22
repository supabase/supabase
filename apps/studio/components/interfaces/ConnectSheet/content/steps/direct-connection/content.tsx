import { useParams } from 'common'
import { useMemo } from 'react'
import { Badge } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { getConnectionStrings } from '../../../DatabaseSettings.utils'
import { IPv4StatusPanel, type IPv4Status } from './IPv4StatusPanel'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import {
  DATABASE_CONNECTION_TYPES,
  IPV4_ADDON_TEXT,
  PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT,
  type ConnectionStringMethod,
  type DatabaseConnectionType,
} from '@/components/interfaces/ConnectSheet/Connect.constants'
import type {
  ConnectionStringPooler,
  StepContentProps,
} from '@/components/interfaces/ConnectSheet/Connect.types'
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
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'
import { pluckObjectFields } from '@/lib/helpers'
import { useTrack } from '@/lib/telemetry/track'

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

const CONNECTION_METHOD_TO_TELEMETRY: Record<
  ConnectionStringMethod,
  'direct' | 'transaction_pooler' | 'session_pooler'
> = {
  direct: 'direct',
  transaction: 'transaction_pooler',
  session: 'session_pooler',
}

/**
 * Step component for direct database connections.
 * Uses state to determine which connection string to show.
 */
function DirectConnectionContent({ state }: StepContentProps) {
  const track = useTrack()
  const { ref: projectRef } = useParams()
  const { hasAccess: hasDedicatedPooler } = useCheckEntitlements('dedicated_pooler')
  const isHighAvailability = useIsHighAvailability()

  const connectionSource = state.connectionSource
  const connectionType = (state.connectionType as DatabaseConnectionType) ?? 'uri'
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const useSharedPooler = Boolean(state.useSharedPooler)

  const connectionStrings = useConnectionStringDatabases()
  const connectionStringPooler: ConnectionStringPooler | undefined =
    connectionStrings[connectionSource as keyof typeof connectionStrings]
  const hasIPv4Addon = connectionStringPooler?.ipv4SupportedForDedicatedPooler ?? false

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

  const trackCopy = () => {
    const typeConfig = DATABASE_CONNECTION_TYPES.find((t) => t.id === connectionType)
    track('connection_string_copied', {
      connectionType: typeConfig?.label ?? connectionType,
      lang: typeConfig?.lang ?? 'bash',
      connectionMethod: CONNECTION_METHOD_TO_TELEMETRY[connectionMethod],
      connectionTab: 'Connection String',
      source: 'studio',
    })
  }

  if (!resolvedConnectionString) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  const sharedPoolerPreferred = !hasDedicatedPooler
  const ipv4AddOnUrl = {
    text: 'IPv4 add-on',
    url: `/project/${projectRef}/settings/addons?panel=ipv4`,
  }
  const ipv4SettingsUrl = {
    text: 'IPv4 settings',
    url: `/project/${projectRef}/settings/addons?panel=ipv4`,
  }
  const poolerSettingsUrl = {
    text: 'Pooler settings',
    url: `/project/${projectRef}/database/settings#connection-pooling`,
  }
  const buttonLinks = !hasIPv4Addon
    ? [ipv4AddOnUrl, ...(sharedPoolerPreferred ? [poolerSettingsUrl] : [])]
    : [ipv4SettingsUrl, ...(sharedPoolerPreferred ? [poolerSettingsUrl] : [])]

  let ipv4Status: IPv4Status
  if (connectionMethod === 'direct') {
    ipv4Status = {
      type: !hasIPv4Addon ? 'error' : 'success',
      title: !hasIPv4Addon ? 'Not IPv4 compatible' : 'IPv4 compatible',
      description:
        !sharedPoolerPreferred && !hasIPv4Addon
          ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
          : sharedPoolerPreferred
            ? 'Use Session Pooler if on a IPv4 network or purchase IPv4 add-on'
            : IPV4_ADDON_TEXT,
      links: buttonLinks,
    }
  } else if (connectionMethod === 'transaction') {
    const isUsingSharedPooler = useSharedPooler || !hasDedicatedPooler
    ipv4Status = {
      type: !isUsingSharedPooler && !hasIPv4Addon ? 'error' : 'success',
      title: !isUsingSharedPooler && !hasIPv4Addon ? 'Not IPv4 compatible' : 'IPv4 compatible',
      description:
        !isUsingSharedPooler && !hasIPv4Addon
          ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
          : isUsingSharedPooler
            ? 'Transaction pooler connections are IPv4 proxied for free.'
            : IPV4_ADDON_TEXT,
      links: !isUsingSharedPooler ? buttonLinks : undefined,
    }
  } else {
    ipv4Status = {
      type: 'success',
      title: 'IPv4 compatible',
      description: 'Session pooler connections are IPv4 proxied for free',
    }
  }

  const poolerBadge =
    connectionMethod === 'transaction'
      ? useSharedPooler || !hasDedicatedPooler
        ? 'Shared Pooler'
        : 'Dedicated Pooler'
      : connectionMethod === 'session'
        ? 'Shared Pooler'
        : null

  return (
    <div className="flex flex-col gap-2">
      {poolerBadge && !isHighAvailability && (
        <div className="flex items-center gap-x-2">
          <Badge>{poolerBadge}</Badge>
        </div>
      )}
      <CodeBlock
        className="[&_code]:text-foreground"
        wrapperClassName="lg:col-span-2"
        value={connectionString}
        hideLineNumbers
        language="bash"
        onCopyCallback={trackCopy}
      >
        {connectionString}
      </CodeBlock>
      {projectRef && !isHighAvailability && (
        <div className="mt-2">
          <IPv4StatusPanel
            method={connectionMethod}
            ipv4Status={ipv4Status}
            projectRef={projectRef}
          />
        </div>
      )}
      <ConnectionParameters
        parameters={buildConnectionParameters(connectionParams)}
        onCopy={trackCopy}
      />
    </div>
  )
}

export default DirectConnectionContent
