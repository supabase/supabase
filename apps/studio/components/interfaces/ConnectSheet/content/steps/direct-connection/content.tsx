import { useParams } from 'common'
import { Check, KeyRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { buildConnectionStringPooler, getConnectionStrings } from '../../../DatabaseSettings.utils'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import {
  DATABASE_CONNECTION_TYPES,
  type ConnectionStringMethod,
  type DatabaseConnectionType,
} from '@/components/interfaces/ConnectSheet/Connect.constants'
import type {
  ConnectionStringPooler,
  DeploymentMode,
  StepContentProps,
} from '@/components/interfaces/ConnectSheet/Connect.types'
import { ConnectionParameters } from '@/components/interfaces/ConnectSheet/ConnectionParameters'
import {
  buildConnectionParameters,
  buildConnectionStringWithPassword,
  buildSafeConnectionString,
  parseConnectionParams,
  PASSWORD_PLACEHOLDER,
  resolveConnectionString,
} from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { PasswordEncodingNote } from '@/components/interfaces/ConnectSheet/PasswordEncodingNote'
import { ResetDbPasswordDialog } from '@/components/interfaces/Settings/Database/DatabaseSettings/ResetDbPasswordDialog'
import { InlineLink } from '@/components/ui/InlineLink'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from '@/data/database/supavisor-configuration-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
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
const useConnectionStringDatabases = (deploymentMode: DeploymentMode) => {
  const { ref: projectRef } = useParams()
  const { hasAccess: allowPgBouncerSelection } = useCheckEntitlements('dedicated_pooler')

  const { data: databases = [] } = useReadReplicasQuery({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  // Memoized so the per-database pooler bag (consumed by resolveConnectionString
  // downstream) keeps a stable identity across renders. Without this the inner
  // pluckObjectFields/getConnectionStrings calls would mint fresh objects every
  // render and ripple through the resolveConnectionString useMemo below.
  return useMemo(() => {
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
          buildConnectionStringPooler({
            deploymentMode,
            connectionInfo,
            connectionStringsShared,
            connectionStringsDedicated,
            ipv4Addon: !!ipv4Addon,
          }),
        ]
      })
    )
  }, [
    databases,
    pgbouncerConfig,
    supavisorConfig,
    allowPgBouncerSelection,
    ipv4Addon,
    projectRef,
    deploymentMode,
  ])
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
function DirectConnectionContent({ state, deploymentMode }: StepContentProps) {
  const track = useTrack()
  const { hasAccess: hasDedicatedPooler } = useCheckEntitlements('dedicated_pooler')
  const isHighAvailability = useIsHighAvailability()
  const [temporaryDatabasePassword, setTemporaryDatabasePassword] = useState('')

  const connectionSource = state.connectionSource
  const connectionType = (state.connectionType as DatabaseConnectionType) ?? 'uri'
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const useSharedPooler = Boolean(state.useSharedPooler)

  const connectionStrings = useConnectionStringDatabases(deploymentMode)
  const connectionStringPooler: ConnectionStringPooler | undefined =
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

  const redactedConnectionString = useMemo(() => {
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

  const connectionString = useMemo(() => {
    if (!temporaryDatabasePassword) return redactedConnectionString

    if (connectionType === 'psql') {
      return redactedConnectionString
    }

    return buildConnectionStringWithPassword(redactedConnectionString, temporaryDatabasePassword)
  }, [connectionType, redactedConnectionString, temporaryDatabasePassword])

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

  const poolerBadge =
    connectionMethod === 'transaction'
      ? useSharedPooler || !hasDedicatedPooler
        ? 'Shared Pooler'
        : 'Dedicated Pooler'
      : connectionMethod === 'session'
        ? 'Shared Pooler'
        : null

  const showSelfHostedDirectNotice = deploymentMode.isSelfHosted && connectionMethod === 'direct'

  return (
    <div className="flex flex-col gap-2">
      {deploymentMode.isPlatform && poolerBadge && !isHighAvailability && (
        <div className="flex items-center gap-x-2">
          <Badge>{poolerBadge}</Badge>
        </div>
      )}
      {connectionString.includes(PASSWORD_PLACEHOLDER) && <PasswordEncodingNote />}
      <div className="overflow-hidden rounded-lg border bg-surface-75">
        <div data-connect-copy-value={redactedConnectionString}>
          <CodeBlock
            className="rounded-none border-0 [&_code]:text-foreground"
            wrapperClassName="lg:col-span-2"
            value={connectionString}
            hideLineNumbers
            language="bash"
            onCopyCallback={trackCopy}
          >
            {connectionString}
          </CodeBlock>
        </div>
        {deploymentMode.isPlatform && (
          <div className="flex flex-col gap-2 border-t px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-foreground-light">
              {temporaryDatabasePassword ? (
                <span className="flex items-center gap-2">
                  <Check size={16} className="text-brand shrink-0" />
                  <span>New password shown until refresh.</span>
                </span>
              ) : (
                'Forgot your database password?'
              )}
            </div>
            <ResetDbPasswordDialog
              triggerLabel="Reset password"
              triggerIcon={<KeyRound />}
              onPasswordReset={setTemporaryDatabasePassword}
            />
          </div>
        )}
      </div>
      {showSelfHostedDirectNotice && (
        <p className="text-sm text-foreground-light">
          Manually{' '}
          <InlineLink
            href={`${DOCS_URL}/guides/self-hosting/docker#exposing-your-postgres-database`}
          >
            configurable
          </InlineLink>{' '}
          for self-hosted Supabase.
        </p>
      )}
      <ConnectionParameters
        parameters={buildConnectionParameters(connectionParams)}
        onCopy={trackCopy}
      />
    </div>
  )
}

export default DirectConnectionContent
