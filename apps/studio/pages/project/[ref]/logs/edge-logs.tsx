import { useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { parseAsString, useQueryState } from 'nuqs'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)

  return (
    <LogsPreviewer
      condensedLayout
      queryType="api"
      projectRef={ref as string}
      tableName={LogsTableName.EDGE}
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Edge Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
