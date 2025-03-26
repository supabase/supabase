import dynamic from 'next/dynamic'
import { forwardRef, HTMLAttributes, useMemo } from 'react'

import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { pluckObjectFields } from 'lib/helpers'
import { cn } from 'ui'
import type { projectKeys } from './Connect.types'
import { getConnectionStrings as getConnectionStringsV2 } from './DatabaseSettings.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { getAddons } from '../Billing/Subscription/Subscription.utils'

interface ConnectContentTabProps extends HTMLAttributes<HTMLDivElement> {
  projectKeys: projectKeys
  filePath: string
  connectionStringPooler?: {
    transactionShared: string
    sessionShared: string
    transactionDedicated?: string
    sessionDedicated?: string
    ipv4SupportedForDedicatedPooler: boolean
  }
}

const ConnectTabContent = forwardRef<HTMLDivElement, ConnectContentTabProps>(
  ({ projectKeys, filePath, ...props }, ref) => {
    const { ref: projectRef } = useParams()
    const selectedOrg = useSelectedOrganization()
    const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })
    const allowPgBouncerSelection = useMemo(() => subscription?.plan.id !== 'free', [subscription])

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

    const connectionStringsShared =
      poolingConfigurationShared !== undefined
        ? getConnectionStringsV2({
            connectionInfo,
            poolingInfo: {
              connectionString: poolingConfigurationShared.connection_string,
              db_host: poolingConfigurationShared.db_host,
              db_name: poolingConfigurationShared.db_name,
              db_port: poolingConfigurationShared.db_port,
              db_user: poolingConfigurationShared.db_user,
            },
            metadata: { projectRef },
          })
        : { direct: { uri: '' }, pooler: { uri: '' } }

    const connectionStringsDedicated =
      poolingConfigurationDedicated !== undefined
        ? getConnectionStringsV2({
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
          }}
        />
      </div>
    )
  }
)

ConnectTabContent.displayName = 'ConnectTabContent'

export default ConnectTabContent
