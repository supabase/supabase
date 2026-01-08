import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)

  return (
    <LogsPreviewer
      condensedLayout
      queryType="database"
      projectRef={ref as string}
      tableName={LogsTableName.POSTGRES}
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Postgres Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
