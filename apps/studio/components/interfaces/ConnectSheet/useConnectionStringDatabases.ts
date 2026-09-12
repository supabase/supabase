import { useParams } from 'common'
import { useMemo } from 'react'

import { CONNECTION_SOURCE_LOAD_BALANCER } from './Connect.constants'
import type { DeploymentMode } from './Connect.types'
import {
  buildConnectionStringPooler,
  getConnectionStrings,
  getHighAvailabilityLoadBalancerConnectionInfo,
} from './DatabaseSettings.utils'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from '@/data/database/supavisor-configuration-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'
import { pluckObjectFields } from '@/lib/helpers'

/**
 * [Joshen] ConnectStepsSection does something similar but since only this page needs to consider connection strings
 * from all databases (including read replicas), am opting to separate the logic for retrieving connection strings here
 *
 * We can however, consider to shift this logic into ConnectStepsSection, such that we can consider read replicas for
 * the other tabs like "Framework" and "ORM" too. However, leaving them out for now and only updating "Direct"
 */
export const useConnectionStringDatabases = (deploymentMode: DeploymentMode) => {
  const { ref: projectRef } = useParams()
  const { hasAccess: allowPgBouncerSelection } = useCheckEntitlements('dedicated_pooler')
  const isHighAvailability = useIsHighAvailability()

  const { data: databases = [] } = useReadReplicasQuery({ projectRef })
  // Multigres has no pooler, so the pooler config endpoints don't apply
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery(
    { projectRef },
    { enabled: !isHighAvailability }
  )
  const { data: supavisorConfig } = useSupavisorConfigurationQuery(
    { projectRef },
    { enabled: !isHighAvailability }
  )
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  // Memoized so the per-database pooler bag (consumed by resolveConnectionString
  // downstream) keeps a stable identity across renders. Without this the inner
  // pluckObjectFields/getConnectionStrings calls would mint fresh objects every
  // render and ripple through the resolveConnectionString useMemo below.
  return useMemo(() => {
    const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
    const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }

    const connectionStringsByIdentifier = Object.fromEntries(
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
            isHighAvailability,
          }),
        ]
      })
    )

    // The Multigres load balancer is not a database row — it shares the
    // primary's host on a dedicated read-only port.
    const primaryDatabase = isHighAvailability
      ? databases.find((db) => db.identifier === projectRef)
      : undefined
    if (primaryDatabase) {
      const loadBalancerInfo = getHighAvailabilityLoadBalancerConnectionInfo(
        pluckObjectFields(primaryDatabase, DB_FIELDS)
      )
      connectionStringsByIdentifier[CONNECTION_SOURCE_LOAD_BALANCER] = buildConnectionStringPooler({
        deploymentMode,
        connectionInfo: loadBalancerInfo,
        connectionStringsShared: getConnectionStrings({
          connectionInfo: loadBalancerInfo,
          metadata: { projectRef },
        }),
        ipv4Addon: false,
        isHighAvailability,
      })
    }

    return connectionStringsByIdentifier
  }, [
    databases,
    pgbouncerConfig,
    supavisorConfig,
    allowPgBouncerSelection,
    ipv4Addon,
    projectRef,
    deploymentMode,
    isHighAvailability,
  ])
}
