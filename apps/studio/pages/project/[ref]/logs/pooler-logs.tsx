import { useParams } from 'common'

import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import type { NextPageWithLayout } from 'types'
import { Loading } from 'components/ui/Loading'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { isLoading } = usePoolingConfigurationQuery({ projectRef: ref ?? 'default' })

  // this prevents initial load of pooler logs before config has been retrieved
  if (isLoading) return <Loading />

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
