import { useParams } from 'common'
import dynamic from 'next/dynamic'

import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { projectKeys } from './Connect.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { getConnectionStrings } from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseSettings.utils'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { pluckObjectFields } from 'lib/helpers'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'

interface ConnectContentTabProps {
  projectKeys: projectKeys
  filePath: string
  connectionStringPooler?: string
  connectionStringDirect?: string
}

const ConnectTabContentNew = ({ projectKeys, filePath }: ConnectContentTabProps) => {
  const { ref } = useParams()

  const { data } = useProjectSettingsQuery({ projectRef: ref })
  const { data: poolingInfo } = usePoolingConfigurationQuery({ projectRef: ref })

  const { project } = data ?? {}
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(project || emptyState, DB_FIELDS)
  const poolingConfiguration = poolingInfo?.find((x) => x.database_type === 'PRIMARY')

  const connectionStringsPooler =
    poolingConfiguration !== undefined
      ? getConnectionStrings(connectionInfo, poolingConfiguration, {
          projectRef: ref,
          usePoolerConnection: true,
        })
      : { uri: '' }
  const connectionStringsDirect =
    poolingConfiguration !== undefined
      ? getConnectionStrings(connectionInfo, poolingConfiguration, {
          projectRef: ref,
          usePoolerConnection: false,
        })
      : { uri: '' }
  const connectionStringPooler = connectionStringsPooler.uri
  const connectionStringDirect = connectionStringsDirect.uri

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
    <div className="border rounded-lg">
      <ContentFile
        projectKeys={projectKeys}
        filePath={filePath}
        connectionStringPooler={connectionStringPooler}
        connectionStringDirect={connectionStringDirect}
      />
    </div>
  )
}

export default ConnectTabContentNew
