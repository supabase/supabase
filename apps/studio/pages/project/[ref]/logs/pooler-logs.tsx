import { useParams } from 'common'

import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { NextPageWithLayout } from 'types'
import Connecting from 'components/ui/Loading/Loading'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { isLoading } = usePoolingConfigurationQuery({ projectRef: ref ?? 'default' })

  // this prevents initial load of pooler logs before config has been retrieved
  if (isLoading) return <Connecting />

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.SUPAVISOR}
      queryType={'supavisor'}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default LogPage
