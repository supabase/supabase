import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="etl"
      projectRef={ref!}
      tableName={LogsTableName.ETL}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="ETL Replication Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
