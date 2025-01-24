import { useRouter } from 'next/router'

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      condensedLayout
      queryType="fn_edge"
      projectRef={ref as string}
      tableName={LogsTableName.FN_EDGE}
    />
  )
}

LogPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Edge functions logs">
      <LogsLayout title="Edge Functions Logs">{page}</LogsLayout>
    </DefaultLayout>
  </AppLayout>
)

export default LogPage
