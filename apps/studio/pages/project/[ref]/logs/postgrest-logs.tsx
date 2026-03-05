import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsTableEmptyState } from 'components/interfaces/Settings/Logs/LogsTableEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)

  return (
    <LogsPreviewer
      condensedLayout
      queryType="postgrest"
      projectRef={ref as string}
      tableName={LogsTableName.POSTGREST}
      EmptyState={
        <LogsTableEmptyState
          title="No results found"
          description="Only errors are captured into PostgREST logs by default. Check the API Gateway logs for HTTP requests."
        />
      }
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Postgrest Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
