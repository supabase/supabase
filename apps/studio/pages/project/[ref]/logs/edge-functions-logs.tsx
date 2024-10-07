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
      queryType="fn_edge"
      projectRef={ref as string}
      tableName={LogsTableName.FN_EDGE}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Edge Functions Logs">{page}</LogsLayout>

export default LogPage
