import dynamic from 'next/dynamic'
import { forwardRef, HTMLAttributes, useMemo } from 'react'

import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useFlag } from 'hooks/ui/useFlag'
import { pluckObjectFields } from 'lib/helpers'
import { cn } from 'ui'
import type { projectKeys } from './Connect.types'
import { getConnectionStrings as getConnectionStringsV2 } from './DatabaseSettings.utils'

interface ConnectContentTabProps extends HTMLAttributes<HTMLDivElement> {
  projectKeys: projectKeys
  filePath: string
  connectionStringPooler?: {
    transaction: string
    session: string
  }
  connectionStringDirect?: string
}

const ConnectTabContent = forwardRef<HTMLDivElement, ConnectContentTabProps>(
  ({ projectKeys, filePath, ...props }, ref) => {
    const { ref: projectRef } = useParams()
    const allowPgBouncerSelection = useFlag('dualPoolerSupport')

    const { data: settings } = useProjectSettingsV2Query({ projectRef })
    const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
    const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })

    const isPgBouncerEnabled = allowPgBouncerSelection && !!pgbouncerConfig?.pgbouncer_enabled
    const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
    const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
    const connectionInfo = pluckObjectFields(settings || emptyState, DB_FIELDS)
    const poolingConfiguration = isPgBouncerEnabled
      ? pgbouncerConfig
      : supavisorConfig?.find((x) => x.database_type === 'PRIMARY')

    const connectionStrings =
      poolingConfiguration !== undefined
        ? getConnectionStringsV2({
            connectionInfo,
            poolingInfo: {
              connectionString:
                'connection_string' in poolingConfiguration
                  ? poolingConfiguration.connection_string
                  : poolingConfiguration.connectionString,
              db_host: poolingConfiguration.db_host,
              db_name: poolingConfiguration.db_name,
              db_port: poolingConfiguration.db_port,
              db_user: poolingConfiguration.db_user,
            },
            metadata: { projectRef },
          })
        : { direct: { uri: '' }, pooler: { uri: '' } }
    const connectionStringsPooler = connectionStrings.pooler
    const connectionStringsDirect = connectionStrings.direct

    const connectionStringPoolerTransaction = connectionStringsPooler.uri
    const connectionStringPoolerSession = connectionStringsPooler.uri.replace('6543', '5432')

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
            transaction: connectionStringPoolerTransaction,
            session: connectionStringPoolerSession,
          }}
          connectionStringDirect={connectionStringsDirect.uri}
        />
      </div>
    )
  }
)

ConnectTabContent.displayName = 'ConnectTabContent'

export default ConnectTabContent
