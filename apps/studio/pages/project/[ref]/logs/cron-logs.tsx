// select * from cron.job_run_details where jobid = '1' order by start_time desc limit 10

import { useRouter } from 'next/router'

import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.PG_CRON}
      queryType={'pg_cron'}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Cron Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
