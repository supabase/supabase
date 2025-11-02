import dynamic from 'next/dynamic'
import { forwardRef, HTMLAttributes, useMemo } from 'react'

import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { pluckObjectFields } from 'lib/helpers'
import { cn } from 'ui'
import { getAddons } from '../Billing/Subscription/Subscription.utils'
import type { projectKeys } from './Connect.types'
import { getConnectionStrings } from './DatabaseSettings.utils'

interface ConnectContentTabProps extends HTMLAttributes<HTMLDivElement> {
  projectKeys: projectKeys
  filePath: string
  connectionStringPooler?: {
    transactionShared: string
    sessionShared: string
    transactionDedicated?: string
    sessionDedicated?: string
    ipv4SupportedForDedicatedPooler: boolean
    direct?: string
  }
}

export const ConnectTabContent = forwardRef<HTMLDivElement, ConnectContentTabProps>(
  ({ projectKeys, filePath, ...props }, ref) => {
    const { ref: projectRef } = useParams()
    const { data: selectedOrg } = useSelectedOrganizationQuery()
    const allowPgBouncerSelection = useMemo(() => selectedOrg?.plan.id !== 'free', [selectedOrg])

    const { data: settings } = useProjectSettingsV2Query({ projectRef })
    const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
    const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
    const { data: addons } = useProjectAddonsQuery({ projectRef })
    const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

    const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
    const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
    const connectionInfo = pluckObjectFields(settings || emptyState, DB_FIELDS)
    const poolingConfigurationShared = supavisorConfig?.find((x) => x.database_type === 'PRIMARY')
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
      metadata: { projectRef },
    })

    const connectionStringsDedicated =
      poolingConfigurationDedicated !== undefined
        ? getConnectionStrings({
            connectionInfo,
            poolingInfo: {
              connectionString: poolingConfigurationDedicated.connection_string,
              db_host: poolingConfigurationDedicated.db_host,
              db_name: poolingConfigurationDedicated.db_name,
              db_port: poolingConfigurationDedicated.db_port,
              db_user: poolingConfigurationDedicated.db_user,
            },
            metadata: { projectRef },
          })
        : undefined

    const ContentFile = useMemo(() => {
      return dynamic<ConnectContentTabProps>(() => import(`./content/${filePath}/content`), {
        loading: () => (
          <div className="p-4 min-h-[331px]">
            <GenericSkeletonLoader />
          </div>
        ),
      })
    }, [filePath])

    return (
      <div ref={ref} {...props} className={cn('border rounded-lg', props.className)}>
        <ContentFile
          projectKeys={projectKeys}
          filePath={filePath}
          connectionStringPooler={{
            transactionShared: connectionStringsShared.pooler.uri,
            sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
            transactionDedicated: connectionStringsDedicated?.pooler.uri,
            sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
            ipv4SupportedForDedicatedPooler: !!ipv4Addon,
            direct: connectionStringsShared.direct.uri,
          }}
        />
      </div>
    )
  }
)

ConnectTabContent.displayName = 'ConnectTabContent'
