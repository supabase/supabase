import { useParams } from 'common'
import dynamic from 'next/dynamic'
import { forwardRef, HTMLAttributes } from 'react'

import { getConnectionStrings } from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseSettings.utils'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { pluckObjectFields } from 'lib/helpers'
import type { projectKeys } from './Connect.types'
import { cn } from 'ui'

interface ConnectContentTabProps extends HTMLAttributes<HTMLDivElement> {
  projectKeys: projectKeys
  filePath: string
  connectionStringPooler?: {
    transaction: string
    session: string
  }
  connectionStringDirect?: string
}

const ConnectTabContentNew = forwardRef<HTMLDivElement, ConnectContentTabProps>(
  ({ projectKeys, filePath, ...props }, ref) => {
    const { ref: projectRef } = useParams()
    const { data } = useProjectSettingsQuery({ projectRef })
    const { data: poolingInfo } = usePoolingConfigurationQuery({ projectRef })

    const { project } = data ?? {}
    const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
    const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
    const connectionInfo = pluckObjectFields(project || emptyState, DB_FIELDS)
    const poolingConfiguration = poolingInfo?.find((x) => x.database_type === 'PRIMARY')

    const connectionStringsPooler =
      poolingConfiguration !== undefined
        ? getConnectionStrings(connectionInfo, poolingConfiguration, {
            projectRef,
            usePoolerConnection: true,
          })
        : { uri: '' }
    const connectionStringsDirect =
      poolingConfiguration !== undefined
        ? getConnectionStrings(connectionInfo, poolingConfiguration, {
            projectRef,
            usePoolerConnection: false,
          })
        : { uri: '' }
    const connectionStringPoolerTransaction = connectionStringsPooler.uri
    const connectionStringPoolerSession = connectionStringsPooler.uri.replace('6543', '5432')

    const ContentFile = dynamic<ConnectContentTabProps>(
      () => import(`./content/${filePath}/content`),
      {
        loading: () => (
          <div className="p-4 min-h-[331px]">
            <GenericSkeletonLoader />
          </div>
        ),
      }
    )

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

ConnectTabContentNew.displayName = 'ConnectTabContentNew'

export default ConnectTabContentNew
