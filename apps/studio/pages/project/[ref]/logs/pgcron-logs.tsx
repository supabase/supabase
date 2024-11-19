import { useRouter } from 'next/router'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      condensedLayout
      queryType="pg_cron"
      projectRef={ref as string}
      tableName={LogsTableName.PG_CRON}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="PgCron Logs">{page}</LogsLayout>

export default LogPage
