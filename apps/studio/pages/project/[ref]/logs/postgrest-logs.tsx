import { useRouter } from 'next/router'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { LogsTableEmptyState } from 'components/interfaces/Settings/Logs/LogsTableEmptyState'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

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
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Postgrest Logs">{page}</LogsLayout>

export default LogPage
